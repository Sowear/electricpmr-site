import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type EstimateStatus =
  | "draft" | "sent" | "viewed" | "approved" | "converted"
  | "rejected" | "pending_prepayment" | "prepayment_received"
  | "in_progress" | "completed" | "closed";

const ALLOWED_TRANSITIONS: Record<EstimateStatus, EstimateStatus[]> = {
  draft: ["sent"],
  sent: ["approved", "rejected"],
  viewed: ["approved", "rejected"],
  approved: ["pending_prepayment", "in_progress"],
  pending_prepayment: ["prepayment_received", "rejected"],
  prepayment_received: ["in_progress"],
  in_progress: ["completed"],
  completed: ["closed"],
  closed: [],
  rejected: ["draft"],
  converted: [],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    
    const userRoles = (roles || []).map((r: any) => r.role);
    const canChange = userRoles.some((r: string) =>
      ["admin", "super_admin", "manager"].includes(r)
    );

    if (!canChange) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { estimateId, newStatus, comment } = await req.json();

    if (!estimateId || !newStatus) {
      return new Response(JSON.stringify({ error: "estimateId and newStatus required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch estimate
    const { data: estimate, error: fetchErr } = await supabase
      .from("estimates")
      .select("*")
      .eq("id", estimateId)
      .single();

    if (fetchErr || !estimate) {
      return new Response(JSON.stringify({ error: "Estimate not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentStatus = estimate.status as EstimateStatus;
    const targetStatus = newStatus as EstimateStatus;

    // Validate transition
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      return new Response(JSON.stringify({
        error: `Transition from "${currentStatus}" to "${targetStatus}" is not allowed`,
        valid: false,
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Precondition checks
    if (targetStatus === "in_progress") {
      if ((estimate.deposit_pct || 0) > 0 && !estimate.prepayment_confirmed) {
        return new Response(JSON.stringify({
          error: "Cannot start work without confirmed prepayment",
          valid: false,
        }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!estimate.payment_method) {
        return new Response(JSON.stringify({
          error: "Payment method required before starting work",
          valid: false,
        }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!estimate.payment_recipient) {
        return new Response(JSON.stringify({
          error: "Payment recipient required before starting work",
          valid: false,
        }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (targetStatus === "prepayment_received") {
      if (!estimate.payment_method || !estimate.payment_recipient) {
        return new Response(JSON.stringify({
          error: "Payment method and recipient required for prepayment confirmation",
          valid: false,
        }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Apply transition
    const oldStatus = estimate.status;
    const updateData: Record<string, any> = { status: targetStatus };
    if (targetStatus === "sent") updateData.sent_at = new Date().toISOString();
    if (targetStatus === "approved") updateData.approved_at = new Date().toISOString();
    if (targetStatus === "prepayment_received") {
      updateData.prepayment_confirmed = true;
      updateData.prepayment_confirmed_at = new Date().toISOString();
    }

    const { error: updateErr } = await supabase
      .from("estimates")
      .update(updateData)
      .eq("id", estimateId);

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Audit log
    await supabase.from("estimate_history").insert({
      estimate_id: estimateId,
      action: "status_change",
      changed_by: user.id,
      old_values: { status: oldStatus },
      new_values: { status: targetStatus, comment: comment || null },
    });

    // Notification
    if (estimate.created_by && estimate.created_by !== user.id) {
      const STATUS_LABELS: Record<string, string> = {
        draft: "Черновик", sent: "Отправлена", viewed: "Просмотрена",
        approved: "Согласована", pending_prepayment: "Ожидает предоплату",
        prepayment_received: "Предоплата получена", in_progress: "В работе",
        completed: "Завершена", closed: "Закрыта", rejected: "Отклонена",
        converted: "Конвертирована",
      };

      await supabase.from("notifications").insert({
        user_id: estimate.created_by,
        type: "status_change",
        title: `${estimate.estimate_number}: ${STATUS_LABELS[oldStatus] || oldStatus} → ${STATUS_LABELS[targetStatus] || targetStatus}`,
        message: `Смета для ${estimate.client_name}`,
        link: `/estimator/${estimateId}`,
      });
    }

    return new Response(JSON.stringify({
      valid: true,
      estimateId,
      oldStatus,
      newStatus: targetStatus,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
