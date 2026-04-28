import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AutomationCheckRequest {
  soilMoisture: string;
  soilMoisturePercentage?: number | null;
  temperature: number;
  humidity: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const userId = claimsData.claims.sub;

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { soilMoisture, soilMoisturePercentage, temperature, humidity }: AutomationCheckRequest = await req.json();

    console.log("Auto-control check:", { userId, soilMoisture, soilMoisturePercentage, temperature, humidity });

    const { data: config } = await serviceClient
      .from('alert_configurations')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const soilMin = Number(config?.soil_moisture_min ?? 30);
    const soilMax = Number(config?.soil_moisture_max ?? 70);
    const tempMax = Number(config?.temp_max ?? 35);
    const humidityMax = Number(config?.humidity_max ?? 80);

    // Determine current state from latest executed command per device
    const { data: recentCommands } = await serviceClient
      .from('device_commands')
      .select('device, action, status, created_at')
      .eq('user_id', userId)
      .in('device', ['irrigation', 'fan'])
      .order('created_at', { ascending: false })
      .limit(20);

    const currentState = (device: string): 'on' | 'off' | 'unknown' => {
      const last = recentCommands?.find((c) => c.device === device && c.status === 'executed');
      return (last?.action as 'on' | 'off') ?? 'unknown';
    };
    const hasPending = (device: string) =>
      recentCommands?.some((c) => c.device === device && c.status === 'pending') ?? false;

    // ===== Irrigation logic (soil moisture thresholds) =====
    let desiredIrrigation: 'on' | 'off' | null = null;
    let irrigationReason = '';

    const soilPct = typeof soilMoisturePercentage === 'number' ? soilMoisturePercentage : null;

    if (soilPct !== null) {
      if (soilPct < soilMin) {
        desiredIrrigation = 'on';
        irrigationReason = `Soil moisture ${soilPct}% below minimum ${soilMin}%`;
      } else if (soilPct > soilMax) {
        desiredIrrigation = 'off';
        irrigationReason = `Soil moisture ${soilPct}% above maximum ${soilMax}%`;
      }
    } else {
      // Fallback to digital classification
      if (soilMoisture === 'Dry') {
        desiredIrrigation = 'on';
        irrigationReason = 'Soil is Dry';
      } else if (soilMoisture === 'Wet') {
        desiredIrrigation = 'off';
        irrigationReason = 'Soil is Wet';
      }
    }

    // ===== Fan logic (temperature/humidity thresholds) =====
    let desiredFan: 'on' | 'off' | null = null;
    let fanReason = '';

    if (temperature > tempMax) {
      desiredFan = 'on';
      fanReason = `Temperature ${temperature}°C above ${tempMax}°C`;
    } else if (humidity > humidityMax) {
      desiredFan = 'on';
      fanReason = `Humidity ${humidity}% above ${humidityMax}%`;
    } else if (temperature < tempMax - 2 && humidity < humidityMax - 5) {
      desiredFan = 'off';
      fanReason = `Climate back within range`;
    }

    const queueCommand = async (device: 'irrigation' | 'fan', action: 'on' | 'off', reason: string) => {
      if (hasPending(device)) {
        console.log(`Skip ${device} ${action}: pending command exists`);
        return false;
      }
      if (currentState(device) === action) {
        console.log(`Skip ${device} ${action}: already ${action}`);
        return false;
      }
      const { error } = await serviceClient.from('device_commands').insert({
        user_id: userId,
        device,
        action,
        status: 'pending',
      });
      if (error) {
        console.error(`Failed to queue ${device} command:`, error);
        return false;
      }
      if (device === 'irrigation') {
        await serviceClient.from('irrigation_logs').insert({
          user_id: userId,
          action,
          trigger_type: 'auto',
          soil_moisture: soilMoisture,
          temperature,
          reason: `AUTO: ${reason}`,
        });
      }
      console.log(`Queued ${device} -> ${action} (${reason})`);
      return true;
    };

    let irrigationQueued = false;
    let fanQueued = false;

    if (desiredIrrigation) {
      irrigationQueued = await queueCommand('irrigation', desiredIrrigation, irrigationReason);
    }
    if (desiredFan) {
      fanQueued = await queueCommand('fan', desiredFan, fanReason);
    }

    return new Response(
      JSON.stringify({
        irrigation: { desired: desiredIrrigation, queued: irrigationQueued, reason: irrigationReason },
        fan: { desired: desiredFan, queued: fanQueued, reason: fanReason },
        thresholds: { soilMin, soilMax, tempMax, humidityMax },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in check-irrigation:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
