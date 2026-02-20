import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const BOARDCRM_API_KEY = Deno.env.get("BOARDCRM_API_KEY");
const BOARDCRM_API_URL = Deno.env.get("BOARDCRM_API_URL");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RequestData {
  name: string;
  phone: string;
  service_type: string;
  description?: string;
  desired_date?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
  ip?: string;
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MINUTES = 10;
const MAX_REQUESTS_PER_WINDOW = 3;

async function checkRateLimit(supabase: any, ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
  
  // Count recent requests from this IP
  const { count, error } = await supabase
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ip)
    .eq("action_type", "request_form")
    .gte("created_at", windowStart);

  if (error) {
    console.error("Rate limit check error:", error);
    // Allow on error to not block legitimate users
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW };
  }

  const requestCount = count || 0;
  const allowed = requestCount < MAX_REQUESTS_PER_WINDOW;
  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - requestCount);

  return { allowed, remaining };
}

async function recordRateLimitHit(supabase: any, ip: string): Promise<void> {
  const { error } = await supabase.from("rate_limits").insert({
    ip_address: ip,
    action_type: "request_form",
  });

  if (error) {
    console.error("Failed to record rate limit:", error);
  }
}

async function sendEmailViaResend(to: string, subject: string, html: string, text: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "ЭлектроМастер <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Resend API error: ${response.status} - ${errorData}`);
  }

  return await response.json();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Get client IP
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     req.headers.get("x-real-ip") ||
                     req.headers.get("cf-connecting-ip") ||
                     "unknown";

    // Check rate limit
    const { allowed, remaining } = await checkRateLimit(supabase, clientIP);
    
    if (!allowed) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Слишком много запросов. Попробуйте через 10 минут.",
          code: "RATE_LIMITED",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": remaining.toString(),
            "Retry-After": (RATE_LIMIT_WINDOW_MINUTES * 60).toString(),
            ...corsHeaders,
          },
        }
      );
    }

    const data: RequestData = await req.json();
    data.ip = clientIP;
    console.log("Received request data:", JSON.stringify(data));

    if (!data.name || !data.phone || !data.service_type) {
      throw new Error("Missing required fields: name, phone, or service_type");
    }

    // Record this request for rate limiting
    await recordRateLimitHit(supabase, clientIP);

    const currentDate = new Date().toLocaleString("ru-RU", {
      timeZone: "Europe/Chisinau",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a2e; border-bottom: 3px solid #f5c518; padding-bottom: 10px;">
          Новая заявка с сайта ЭлектроМастер
        </h1>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 140px;">Имя:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.name}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Телефон:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
              <a href="tel:${data.phone}" style="color: #007bff;">${data.phone}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Тип услуги:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.service_type}</td>
          </tr>
          ${data.description ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Комментарий:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.description}</td>
          </tr>
          ` : ""}
          ${data.desired_date ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Желаемая дата:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.desired_date}</td>
          </tr>
          ` : ""}
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Дата заявки:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${currentDate}</td>
          </tr>
        </table>

        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #666;">Источник</h3>
          <p style="margin: 5px 0; font-size: 14px; color: #888;">
            Ссылка на сайт: <a href="https://electricpmr.lovable.app">https://electricpmr.lovable.app</a>
          </p>
          ${data.utm_source || data.utm_medium || data.utm_campaign ? `
          <p style="margin: 5px 0; font-size: 14px; color: #888;">
            UTM: ${data.utm_source || ""} ${data.utm_medium || ""} ${data.utm_campaign || ""}
          </p>
          ` : ""}
          ${data.referrer ? `
          <p style="margin: 5px 0; font-size: 14px; color: #888;">
            Referrer: ${data.referrer}
          </p>
          ` : ""}
          ${data.ip ? `
          <p style="margin: 5px 0; font-size: 14px; color: #888;">
            IP: ${data.ip}
          </p>
          ` : ""}
        </div>
      </div>
    `;

    const plainText = `
Новая заявка с сайта ЭлектроМастер:

Имя: ${data.name}
Телефон: ${data.phone}
Тип услуги: ${data.service_type}
Комментарий: ${data.description || "-"}
Желаемая дата: ${data.desired_date || "-"}
Дата: ${currentDate}
Ссылка на сайт: https://electricpmr.lovable.app
UTM: ${data.utm_source || ""} ${data.utm_medium || ""} ${data.utm_campaign || ""}
IP: ${data.ip || "-"}
    `.trim();

    console.log("Sending email via Resend...");
    const emailResult = await sendEmailViaResend(
      "mmxxnon@gmail.com",
      "Новая заявка с сайта ЭлектроМастер",
      emailHtml,
      plainText
    );
    console.log("Email sent successfully:", emailResult);

    // Send to BoardCRM if configured
    let crmResult = null;
    if (BOARDCRM_API_KEY && BOARDCRM_API_URL) {
      console.log("Sending to BoardCRM...");
      try {
        const crmPayload = {
          name: data.name,
          phone: data.phone,
          service_type: data.service_type,
          description: data.description || "",
          desired_date: data.desired_date || "",
          source: "website",
          utm_source: data.utm_source || "",
          utm_medium: data.utm_medium || "",
          utm_campaign: data.utm_campaign || "",
          referrer: data.referrer || "",
          ip: data.ip || "",
          status: "new",
          created_at: new Date().toISOString(),
        };

        const crmResponse = await fetch(BOARDCRM_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${BOARDCRM_API_KEY}`,
          },
          body: JSON.stringify(crmPayload),
        });

        if (crmResponse.ok) {
          crmResult = await crmResponse.json();
          console.log("BoardCRM lead created:", crmResult);
        } else {
          const errorText = await crmResponse.text();
          console.error("BoardCRM error:", crmResponse.status, errorText);
        }
      } catch (crmError) {
        console.error("BoardCRM request failed:", crmError);
      }
    } else {
      console.log("BoardCRM not configured, skipping CRM integration");
    }

    return new Response(
      JSON.stringify({
        success: true,
        email: emailResult,
        crm: crmResult,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": (remaining - 1).toString(),
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-request-notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
