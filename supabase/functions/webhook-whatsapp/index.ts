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
    // Extract clinic_id from query params
    const url = new URL(req.url);
    const clinicId = url.searchParams.get("clinic_id");

    if (!clinicId) {
      return new Response(
        JSON.stringify({ error: "clinic_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = await req.json();
    console.log("Webhook received for clinic:", clinicId, JSON.stringify(payload));

    // Evolution API webhook payload structure
    const event = payload.event;
    const data = payload.data;

    if (!event || !data) {
      return new Response(
        JSON.stringify({ received: true, action: "ignored", reason: "no event or data" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle message status updates
    if (event === "messages.update" || event === "message.update") {
      const remoteJid = data.remoteJid || data.key?.remoteJid;
      const messageId = data.id || data.key?.id;
      const status = mapEvolutionStatus(data.status || data.messageStatus);

      if (messageId && status) {
        // Update message_logs by external_id
        const { data: logs } = await supabase
          .from("message_logs")
          .select("id, status")
          .eq("clinic_id", clinicId)
          .eq("external_id", messageId)
          .limit(1);

        if (logs && logs.length > 0) {
          const log = logs[0];
          // Only update if status progresses forward
          if (shouldUpdateStatus(log.status, status)) {
            await supabase.from("message_logs").update({
              status,
              status_updated_at: new Date().toISOString(),
              provider_response: payload,
            }).eq("id", log.id);

            // Also update the queue item if it exists
            const { data: queueItems } = await supabase
              .from("message_queue")
              .select("id")
              .eq("clinic_id", clinicId)
              .eq("provider_response->>key->>id", messageId)
              .limit(1);

            if (queueItems && queueItems.length > 0) {
              await supabase.from("message_queue").update({
                status: status === "delivered" || status === "read" ? "sent" : status,
                provider_response: payload,
              }).eq("id", queueItems[0].id);
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ received: true, action: "status_updated", status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle other events (messages.upsert = incoming messages, etc.)
    // For now, just acknowledge
    return new Response(
      JSON.stringify({ received: true, event, action: "acknowledged" }),
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

function mapEvolutionStatus(status: string | number): string | null {
  // Evolution API status codes
  const statusMap: Record<string, string> = {
    "PENDING": "pending",
    "SERVER_ACK": "sent",
    "DELIVERY_ACK": "delivered",
    "READ": "read",
    "PLAYED": "read",
    "ERROR": "failed",
    "1": "pending",
    "2": "sent",
    "3": "delivered",
    "4": "read",
    "5": "read",
  };
  
  const key = String(status).toUpperCase();
  return statusMap[key] || null;
}

function shouldUpdateStatus(current: string, incoming: string): boolean {
  const order: Record<string, number> = {
    pending: 0,
    sent: 1,
    delivered: 2,
    read: 3,
    failed: -1,
  };
  
  // Failed can always be set
  if (incoming === "failed") return true;
  // Otherwise only progress forward
  return (order[incoming] ?? 0) > (order[current] ?? 0);
}
