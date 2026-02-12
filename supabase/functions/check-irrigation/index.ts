import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AutomationCheckRequest {
  soilMoisture: string;
  temperature: number;
  humidity: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller
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

    const { soilMoisture, temperature, humidity }: AutomationCheckRequest = await req.json();

    console.log("Checking automation needs:", { userId, soilMoisture, temperature, humidity });

    // Get user's alert configuration
    const { data: config, error: configError } = await serviceClient
      .from('alert_configurations')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (configError) {
      console.error("Error fetching config:", configError);
      return new Response(
        JSON.stringify({ shouldIrrigate: false, shouldFan: false, reason: "No configuration found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Irrigation logic
    let shouldIrrigate = false;
    let irrigationReason = "";

    if (soilMoisture === "Dry") {
      shouldIrrigate = true;
      irrigationReason = "Soil moisture is too low (Dry)";
    } else if (temperature > (config?.temp_max || 35) && soilMoisture !== "Wet") {
      shouldIrrigate = true;
      irrigationReason = `High temperature (${temperature}°C) detected with non-optimal soil moisture`;
    }

    // Fan control logic
    let shouldFan = false;
    let fanReason = "";

    const tempMax = config?.temp_max || 35;
    const humidityMax = config?.humidity_max || 80;

    if (temperature > tempMax) {
      shouldFan = true;
      fanReason = `Temperature (${temperature}°C) exceeds threshold (${tempMax}°C)`;
    } else if (humidity > humidityMax) {
      shouldFan = true;
      fanReason = `Humidity (${humidity}%) exceeds threshold (${humidityMax}%)`;
    }

    // Log irrigation action
    if (shouldIrrigate) {
      await serviceClient.from('irrigation_logs').insert({
        user_id: userId,
        action: 'auto',
        trigger_type: 'threshold',
        soil_moisture: soilMoisture,
        temperature: temperature,
        reason: irrigationReason,
      });
      console.log("Irrigation logged:", irrigationReason);
    }

    // Log fan action
    if (shouldFan) {
      await serviceClient.from('irrigation_logs').insert({
        user_id: userId,
        action: 'fan_auto',
        trigger_type: 'threshold',
        soil_moisture: soilMoisture,
        temperature: temperature,
        reason: fanReason,
      });
      console.log("Fan action logged:", fanReason);
    }

    console.log("Automation decision:", { shouldIrrigate, irrigationReason, shouldFan, fanReason });

    return new Response(
      JSON.stringify({ 
        shouldIrrigate, 
        irrigationReason,
        shouldFan,
        fanReason 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in check-irrigation function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
