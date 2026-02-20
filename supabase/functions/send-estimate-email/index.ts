import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MANAGER_EMAIL = "mmxxnon@gmail.com";

interface SendRequest {
  estimateId: string;
  toClient?: boolean;
  toManager?: boolean;
  toTechnician?: boolean;
  includePricesForTechnician?: boolean;
  customEmails?: string[];
  message?: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + " " + currency;
}

function generateLineItemsHTML(lineItems: any[], currency: string, includePrices: boolean): string {
  return lineItems.map((item: any, index: number) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${index + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${item.description}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${item.quantity} ${item.unit || "шт"}</td>
      ${includePrices ? `
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatCurrency(item.unit_price, currency)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatCurrency(item.line_total || 0, currency)}</td>
      ` : ""}
    </tr>
  `).join("");
}

function generateEstimateHTML(estimate: any, lineItems: any[], includePrices: boolean): string {
  const lineItemsHTML = generateLineItemsHTML(lineItems, estimate.currency, includePrices);
  
  return `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Смета ${estimate.estimate_number}</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 40px; color: #1a1a1a; background: #fff; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #eab308; }
  .logo { font-size: 28px; font-weight: 700; }
  .logo-icon { display: inline-block; width: 36px; height: 36px; background: #eab308; border-radius: 8px; text-align: center; line-height: 36px; margin-right: 10px; }
  .client-section { background: #f8f8f8; padding: 24px; border-radius: 12px; margin-bottom: 30px; }
  .client-section h3 { margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #666; }
  .client-name { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; margin: 30px 0; }
  th { background: #1a1a1a; color: white; padding: 14px 12px; text-align: left; font-weight: 500; }
  th:last-child { text-align: right; }
  .totals { margin-left: auto; width: 300px; }
  .total-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
  .total-row.grand-total { border-top: 2px solid #1a1a1a; border-bottom: none; margin-top: 10px; padding-top: 16px; font-size: 20px; font-weight: 700; }
  .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; }
</style></head>
<body>
  <div class="header">
    <div class="logo"><span class="logo-icon">⚡</span>ЭлектроМастер</div>
    <div style="text-align: right;">
      <div style="font-size: 24px; font-weight: 600;">${estimate.estimate_number}</div>
      <div style="color: #666; margin-top: 4px;">от ${formatDate(estimate.created_at)}</div>
      ${!includePrices ? '<div style="color: #e74c3c; margin-top: 4px; font-weight: 600;">Техническая копия</div>' : ""}
    </div>
  </div>
  ${estimate.title ? `<h2 style="margin-bottom: 30px;">${estimate.title}</h2>` : ""}
  <div class="client-section">
    <h3>Клиент</h3>
    <div class="client-name">${estimate.client_name}</div>
    <div style="color: #444; line-height: 1.6;">
      ${estimate.client_phone ? `📞 ${estimate.client_phone}<br>` : ""}
      ${estimate.client_address ? `📍 ${estimate.client_address}` : ""}
    </div>
  </div>
  <table>
    <thead><tr>
      <th style="width: 40px;">№</th>
      <th>Описание</th>
      <th style="width: 100px; text-align: center;">Кол-во</th>
      ${includePrices ? '<th style="width: 120px; text-align: right;">Цена</th><th style="width: 120px; text-align: right;">Сумма</th>' : ""}
    </tr></thead>
    <tbody>${lineItemsHTML}</tbody>
  </table>
  ${includePrices ? `
    <div class="totals">
      <div class="total-row"><span>Подытог:</span><span>${formatCurrency(estimate.subtotal || 0, estimate.currency)}</span></div>
      ${estimate.tax_amount ? `<div class="total-row"><span>Налог:</span><span>${formatCurrency(estimate.tax_amount, estimate.currency)}</span></div>` : ""}
      ${estimate.deposit_amount ? `<div class="total-row"><span>Предоплата:</span><span>${formatCurrency(estimate.deposit_amount, estimate.currency)}</span></div>` : ""}
      <div class="total-row grand-total"><span>ИТОГО:</span><span>${formatCurrency(estimate.total || 0, estimate.currency)}</span></div>
    </div>
  ` : ""}
  ${estimate.notes ? `<div style="background: #fffef0; border-left: 4px solid #eab308; padding: 20px; margin: 30px 0;"><h4 style="margin: 0 0 10px 0;">Примечания</h4><p>${estimate.notes}</p></div>` : ""}
  <div class="footer">
    <p>ЭлектроМастер — профессиональный электромонтаж в Приднестровье</p>
    <p>📞 +373 777 46642 | ✉️ mmxxnon@gmail.com</p>
  </div>
</body></html>`;
}

function generateEmailBody(estimate: any, publicLink: string, message?: string, isTechCopy = false): string {
  return `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <div style="background: #1a1a1a; padding: 30px; text-align: center;">
        <div style="display: inline-block; width: 50px; height: 50px; background: #eab308; border-radius: 12px; line-height: 50px; font-size: 24px; margin-bottom: 10px;">⚡</div>
        <h1 style="color: white; margin: 10px 0 0 0; font-size: 24px;">ЭлектроМастер</h1>
      </div>
      <div style="padding: 40px 30px;">
        ${isTechCopy ? '<p style="color: #e74c3c; font-weight: 600; margin-bottom: 16px;">Техническая копия (без цен)</p>' : ""}
        <p style="font-size: 18px; color: #1a1a1a; margin: 0 0 20px 0;">Здравствуйте!</p>
        <p style="color: #444; line-height: 1.6; margin: 0 0 20px 0;">
          ${isTechCopy ? "Направляем техническую копию сметы (перечень работ без цен)." : `Смета ${estimate.estimate_number} для ${estimate.client_name}.`}
        </p>
        ${message ? `<div style="background: #f8f8f8; border-radius: 8px; padding: 16px; margin-bottom: 20px; font-size: 14px; color: #444; border-left: 3px solid #eab308;">${message}</div>` : ""}
        <div style="background: #f8f8f8; border-radius: 12px; padding: 24px; margin: 20px 0;">
          <div style="margin-bottom: 10px;"><span style="color: #666;">Номер:</span> <strong>${estimate.estimate_number}</strong></div>
          <div style="margin-bottom: 10px;"><span style="color: #666;">Клиент:</span> <strong>${estimate.client_name}</strong></div>
          ${!isTechCopy ? `<div><span style="color: #666;">Сумма:</span> <strong style="font-size: 20px;">${formatCurrency(estimate.total || 0, estimate.currency)}</strong></div>` : ""}
        </div>
        ${publicLink ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${publicLink}" style="display: inline-block; background: #eab308; color: #1a1a1a; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600;">Посмотреть смету</a>
          </div>
        ` : ""}
      </div>
      <div style="background: #f8f8f8; padding: 24px 30px; text-align: center; border-top: 1px solid #eee;">
        <p style="margin: 0; color: #666; font-size: 14px;">+373 777 46642 | mmxxnon@gmail.com</p>
      </div>
    </div>
  </div>
</body></html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase configuration missing");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const body: SendRequest = await req.json();
    const { estimateId, toClient = true, toManager = true, toTechnician = false, includePricesForTechnician = false, customEmails = [], message } = body;

    if (!estimateId) throw new Error("estimateId is required");

    // Fetch estimate
    const { data: estimate, error: estimateError } = await supabase
      .from("estimates").select("*").eq("id", estimateId).single();
    if (estimateError || !estimate) throw new Error("Estimate not found");

    // Fetch line items
    const { data: lineItems } = await supabase
      .from("estimate_line_items").select("*").eq("estimate_id", estimateId).order("position");

    const publicLink = estimate.public_token
      ? `https://electricpmr.lovable.app/estimate/view/${estimate.public_token}`
      : "";

    // Generate HTML attachments
    const internalHTML = generateEstimateHTML(estimate, lineItems || [], true);
    const techHTML = generateEstimateHTML(estimate, lineItems || [], includePricesForTechnician);

    let sentCount = 0;
    const sends: Promise<any>[] = [];

    // 1. Send to client
    if (toClient && estimate.client_email) {
      sends.push(
        resend.emails.send({
          from: "ЭлектроМастер <onboarding@resend.dev>",
          to: [estimate.client_email],
          subject: `Ваша смета — ${estimate.estimate_number}`,
          html: generateEmailBody(estimate, publicLink, message),
          attachments: [{
            filename: `Смета_${estimate.estimate_number}.html`,
            content: btoa(unescape(encodeURIComponent(internalHTML))),
          }],
        }).then(() => { sentCount++; })
      );
    }

    // 2. Send to manager
    if (toManager) {
      sends.push(
        resend.emails.send({
          from: "ЭлектроМастер <onboarding@resend.dev>",
          to: [MANAGER_EMAIL],
          subject: `[Менеджер] Смета ${estimate.estimate_number} — ${estimate.client_name}`,
          html: generateEmailBody(estimate, publicLink, message),
          attachments: [{
            filename: `Смета_${estimate.estimate_number}.html`,
            content: btoa(unescape(encodeURIComponent(internalHTML))),
          }],
        }).then(() => { sentCount++; })
      );
    }

    // 3. Send tech copy
    if (toTechnician) {
      sends.push(
        resend.emails.send({
          from: "ЭлектроМастер <onboarding@resend.dev>",
          to: [MANAGER_EMAIL], // tech email placeholder — goes to manager for now
          subject: `[Электрик] Смета ${estimate.estimate_number} — ${estimate.client_name}`,
          html: generateEmailBody(estimate, "", message, true),
          attachments: [{
            filename: `Техкопия_${estimate.estimate_number}.html`,
            content: btoa(unescape(encodeURIComponent(techHTML))),
          }],
        }).then(() => { sentCount++; })
      );
    }

    // 4. Custom emails
    for (const email of customEmails.filter(Boolean)) {
      sends.push(
        resend.emails.send({
          from: "ЭлектроМастер <onboarding@resend.dev>",
          to: [email],
          subject: `Смета ${estimate.estimate_number} — ${estimate.client_name}`,
          html: generateEmailBody(estimate, publicLink, message),
          attachments: [{
            filename: `Смета_${estimate.estimate_number}.html`,
            content: btoa(unescape(encodeURIComponent(internalHTML))),
          }],
        }).then(() => { sentCount++; })
      );
    }

    await Promise.allSettled(sends);

    // Update status to sent if still draft
    if (estimate.status === "draft") {
      await supabase.from("estimates").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", estimateId);
    }

    // Audit log
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    await supabase.from("estimate_send_log").insert({
      estimate_id: estimateId,
      sent_to_email: [estimate.client_email, toManager ? MANAGER_EMAIL : null, ...customEmails].filter(Boolean).join(", "),
      status: "sent",
      ip_address: clientIp,
    });

    return new Response(JSON.stringify({ success: true, sentCount }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
