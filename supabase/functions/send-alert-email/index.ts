import { serve } from "https://deno.land/std@0.190.0/http/server.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertEmailRequest {
  email: string;
  alertType: string;
  value: number;
  threshold: number;
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, alertType, value, threshold, timestamp }: AlertEmailRequest = await req.json();

    console.log("Sending alert email:", { email, alertType, value, threshold });

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      },
      body: JSON.stringify({
        from: "TerraMonitor <onboarding@resend.dev>",
        to: [email],
        subject: `🚨 TerraMonitor Alert: ${alertType}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626;">Environmental Alert</h1>
            <p>An environmental threshold has been exceeded in your greenhouse:</p>
            
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
              <h2 style="margin: 0 0 10px 0; color: #dc2626;">${alertType}</h2>
              <p style="margin: 5px 0;"><strong>Current Value:</strong> ${value}</p>
              <p style="margin: 5px 0;"><strong>Threshold:</strong> ${threshold}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
            </div>
            
            <p>Please check your greenhouse system and take appropriate action.</p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              This is an automated alert from TerraMonitor.
            </p>
          </div>
        `,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-alert-email function:", error);
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
