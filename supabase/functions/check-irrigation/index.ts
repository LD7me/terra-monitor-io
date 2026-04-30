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
  dli?: number | null;
  isDay?: boolean | null;
}

const GROW_LIGHT_RUNTIME_MS = 2 * 60 * 60 * 1000; // 2 hours

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

    const { soilMoisture, soilMoisturePercentage, temperature, humidity, dli, isDay }: AutomationCheckRequest = await req.json();

    console.log("Auto-control check:", { userId, soilMoisture, soilMoisturePercentage, temperature, humidity, dli, isDay });

    const { data: config } = await serviceClient
      .from('alert_configurations')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const soilMin = Number(config?.soil_moisture_min ?? 30);
    const soilMax = Number(config?.soil_moisture_max ?? 70);
    const tempMax = Number(config?.temp_max ?? 35);
    const humidityMax = Number(config?.humidity_max ?? 80);
    const dliThreshold = Number((config as any)?.dli_threshold ?? 12);

    // Determine current state from latest executed command per device
    const { data: recentCommands } = await serviceClient
      .from('device_commands')
      .select('device, action, status, created_at, executed_at')
      .eq('user_id', userId)
      .in('device', ['irrigation', 'fan', 'grow_light'])
      .order('created_at', { ascending: false })
      .limit(40);

    const lastExecuted = (device: string) =>
      recentCommands?.find((c) => c.device === device && c.status === 'executed') ?? null;

    const currentState = (device: string): 'on' | 'off' | 'unknown' => {
      const last = lastExecuted(device);
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

    // ===== Grow light logic (DLI threshold, evaluated at sunset) =====
    // Trigger ON when daylight ends (isDay=false) AND accumulated DLI < threshold.
    // Auto-OFF after 2 hours of runtime since last 'on' executed command.
    let desiredGrowLight: 'on' | 'off' | null = null;
    let growLightReason = '';

    if (typeof dli === 'number') {
      const lastGrowOn = recentCommands?.find(
        (c) => c.device === 'grow_light' && c.action === 'on' && c.status === 'executed'
      );
      const onSince = lastGrowOn?.executed_at ? new Date(lastGrowOn.executed_at).getTime() : null;
      const isCurrentlyOn = currentState('grow_light') === 'on';

      // Auto-off after 2 hours
      if (isCurrentlyOn && onSince && Date.now() - onSince >= GROW_LIGHT_RUNTIME_MS) {
        desiredGrowLight = 'off';
        growLightReason = `Grow light ran for 2h, turning off`;
      } else if (isDay === false && dli < dliThreshold && !isCurrentlyOn) {
        desiredGrowLight = 'on';
        growLightReason = `Daily DLI ${dli.toFixed(2)} below threshold ${dliThreshold} mol/m²`;
      } else if (isDay === true && isCurrentlyOn) {
        desiredGrowLight = 'off';
        growLightReason = `Daylight returned, turning grow light off`;
      }
    }

    const queueCommand = async (
      device: 'irrigation' | 'fan' | 'grow_light',
      action: 'on' | 'off',
      reason: string,
    ) => {
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
    let growLightQueued = false;

    if (desiredIrrigation) {
      irrigationQueued = await queueCommand('irrigation', desiredIrrigation, irrigationReason);
    }
    if (desiredFan) {
      fanQueued = await queueCommand('fan', desiredFan, fanReason);
    }
    if (desiredGrowLight) {
      growLightQueued = await queueCommand('grow_light', desiredGrowLight, growLightReason);
    }

    return new Response(
      JSON.stringify({
        irrigation: { desired: desiredIrrigation, queued: irrigationQueued, reason: irrigationReason },
        fan: { desired: desiredFan, queued: fanQueued, reason: fanReason },
        grow_light: { desired: desiredGrowLight, queued: growLightQueued, reason: growLightReason },
        thresholds: { soilMin, soilMax, tempMax, humidityMax, dliThreshold },
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
