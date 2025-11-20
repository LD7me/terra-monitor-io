import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface IrrigationCheckRequest {
  userId: string;
  soilMoisture: string;
  temperature: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, soilMoisture, temperature }: IrrigationCheckRequest = await req.json();

    console.log("Checking irrigation needs:", { userId, soilMoisture, temperature });

    // Get user's alert configuration
    const { data: config, error: configError } = await supabase
      .from('alert_configurations')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (configError) {
      console.error("Error fetching config:", configError);
      return new Response(
        JSON.stringify({ shouldIrrigate: false, reason: "No configuration found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Simple threshold-based logic
    let shouldIrrigate = false;
    let reason = "";

    // Check if soil moisture is low (Dry condition)
    if (soilMoisture === "Dry") {
      shouldIrrigate = true;
      reason = "Soil moisture is too low (Dry)";
    } 
    // Also irrigate if temperature is high and soil is not wet
    else if (temperature > (config?.temp_max || 35) && soilMoisture !== "Wet") {
      shouldIrrigate = true;
      reason = `High temperature (${temperature}°C) detected with non-optimal soil moisture`;
    }

    // Log the irrigation decision
    if (shouldIrrigate) {
      await supabase.from('irrigation_logs').insert({
        user_id: userId,
        action: 'auto',
        trigger_type: 'threshold',
        soil_moisture: soilMoisture,
        temperature: temperature,
        reason: reason,
      });
    }

    console.log("Irrigation decision:", { shouldIrrigate, reason });

    return new Response(
      JSON.stringify({ shouldIrrigate, reason }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in check-irrigation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
