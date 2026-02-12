import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const url = new URL(req.url);
    const clinicId = url.searchParams.get("clinic_id");

    if (!clinicId) {
      return new Response(
        JSON.stringify({ error: "clinic_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = await req.json();
    console.log("Z-API Webhook received for clinic:", clinicId, JSON.stringify(payload));

    // Z-API sends different event structures
    // Status update: { phone, zapiMessageId, status, ... }
    // Message received: { phone, text, messageId, ... }
    const zapiMessageId = payload.zapiMessageId || payload.ids?.zapiMessageId || payload.messageId;
    const status = payload.status;

    if (!zapiMessageId && !status) {
      return new Response(
        JSON.stringify({ received: true, action: "ignored", reason: "no messageId or status" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle message status updates from Z-API
    if (status) {
      const mappedStatus = mapZApiStatus(status);

      if (zapiMessageId && mappedStatus) {
        // Find message_log by external_id
        const { data: logs } = await supabase
          .from("message_logs")
          .select("id, status")
          .eq("clinic_id", clinicId)
          .eq("external_id", zapiMessageId)
          .limit(1);

        if (logs && logs.length > 0) {
          const log = logs[0];
          if (shouldUpdateStatus(log.status, mappedStatus)) {
            const updatePayload: Record<string, unknown> = {
              status: mappedStatus,
              status_updated_at: new Date().toISOString(),
              provider_response: payload,
            };

            if (mappedStatus === "sent") {
              updatePayload.sent_at = new Date().toISOString();
            }

            await supabase.from("message_logs").update(updatePayload).eq("id", log.id);

            // Also update queue item if exists
            const { data: queueItems } = await supabase
              .from("message_queue")
              .select("id")
              .eq("clinic_id", clinicId)
              .eq("external_id", zapiMessageId)
              .limit(1);

            if (queueItems && queueItems.length > 0) {
              await supabase.from("message_queue").update({
                status: mappedStatus === "delivered" || mappedStatus === "read" ? "sent" : mappedStatus,
                provider_response: payload,
              }).eq("id", queueItems[0].id);
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ received: true, action: "status_updated", status: mapZApiStatus(status) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ received: true, action: "acknowledged" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("webhook-whatsapp error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function mapZApiStatus(status: string): string | null {
  const statusMap: Record<string, string> = {
    // Z-API status values
    "PENDING": "pending",
    "SENT": "sent",
    "RECEIVED": "delivered",
    "READ": "read",
    "PLAYED": "read",
    "FAILED": "failed",
    "ERROR": "failed",
    "DELETED": "failed",
    // Lowercase variants
    "pending": "pending",
    "sent": "sent",
    "received": "delivered",
    "read": "read",
    "played": "read",
    "failed": "failed",
    "error": "failed",
  };

  return statusMap[status] || null;
}

function shouldUpdateStatus(current: string, incoming: string): boolean {
  const order: Record<string, number> = {
    pending: 0,
    sent: 1,
    delivered: 2,
    read: 3,
    failed: -1,
  };

  if (incoming === "failed") return true;
  return (order[incoming] ?? 0) > (order[current] ?? 0);
}
