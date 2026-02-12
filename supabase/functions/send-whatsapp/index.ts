import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendRequest {
  clinic_id: string;
  phone: string;
  message: string;
  patient_id?: string;
  automation_rule_id?: string;
  queue_id?: string; // if retrying existing queue item
}

function formatPhone(phone: string): string {
  // Remove tudo que não é dígito
  let digits = phone.replace(/\D/g, "");
  // Garante formato internacional BR se necessário
  if (digits.startsWith("0")) digits = digits.substring(1);
  if (!digits.startsWith("55") && digits.length <= 11) digits = "55" + digits;
  return digits;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body: SendRequest = await req.json();
    const { clinic_id, phone, message, patient_id, automation_rule_id, queue_id } = body;

    if (!clinic_id || !phone || !message) {
      return new Response(
        JSON.stringify({ error: "clinic_id, phone e message são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar credenciais Z-API da clínica
    const { data: integration, error: intError } = await supabase
      .from("clinic_channel_integrations")
      .select("*")
      .eq("clinic_id", clinic_id)
      .eq("channel", "whatsapp")
      .eq("provider", "z_api")
      .maybeSingle();

    if (intError) throw intError;

    if (!integration || integration.status !== "active") {
      // Registrar na fila como falha se WhatsApp não configurado
      const queuePayload = {
        clinic_id,
        phone,
        message_body: message,
        patient_id: patient_id || null,
        automation_rule_id: automation_rule_id || null,
        status: "failed",
        attempts: 1,
        error_message: "WhatsApp não configurado para esta clínica",
      };

      if (queue_id) {
        await supabase.from("message_queue").update({
          status: "failed",
          attempts: 1,
          error_message: queuePayload.error_message,
        }).eq("id", queue_id);
      } else {
        await supabase.from("message_queue").insert(queuePayload);
      }

      return new Response(
        JSON.stringify({ error: "WhatsApp não configurado", status: "not_configured" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { base_url, instance_id, access_token } = integration;
    const formattedPhone = formatPhone(phone);

    // Criar ou atualizar item na fila
    let currentQueueId = queue_id;
    let currentAttempts = 0;

    if (queue_id) {
      const { data: existing } = await supabase
        .from("message_queue")
        .select("attempts")
        .eq("id", queue_id)
        .single();
      currentAttempts = existing?.attempts || 0;
    } else {
      const { data: newQueue, error: qErr } = await supabase
        .from("message_queue")
        .insert({
          clinic_id,
          phone: formattedPhone,
          message_body: message,
          patient_id: patient_id || null,
          automation_rule_id: automation_rule_id || null,
          status: "pending",
        })
        .select("id")
        .single();

      if (qErr) throw qErr;
      currentQueueId = newQueue.id;
    }

    // Enviar via Z-API
    const zapiUrl = `${base_url}/instances/${instance_id}/token/${access_token}/send-text`;

    let response: Response;
    let responseBody: any;

    try {
      response = await fetch(zapiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formattedPhone,
          message: message,
        }),
      });
      responseBody = await response.json().catch(() => ({ raw: await response!.text() }));
    } catch (fetchErr: any) {
      // Erro de rede - registrar e possivelmente retry
      const newAttempts = currentAttempts + 1;
      const maxAttempts = 3;
      const shouldRetry = newAttempts < maxAttempts;

      await supabase
        .from("message_queue")
        .update({
          status: shouldRetry ? "pending" : "failed",
          attempts: newAttempts,
          error_message: `Erro de rede: ${fetchErr.message}`,
          provider_response: null,
          next_retry_at: shouldRetry
            ? new Date(Date.now() + newAttempts * 60000).toISOString()
            : null,
        })
        .eq("id", currentQueueId);

      return new Response(
        JSON.stringify({
          error: "Falha de rede ao enviar",
          queue_id: currentQueueId,
          retry: shouldRetry,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newAttempts = currentAttempts + 1;

    if (response!.ok) {
      // Sucesso
      await supabase
        .from("message_queue")
        .update({
          status: "sent",
          attempts: newAttempts,
          provider_response: responseBody,
          sent_at: new Date().toISOString(),
          error_message: null,
          next_retry_at: null,
        })
        .eq("id", currentQueueId);

      return new Response(
        JSON.stringify({ success: true, queue_id: currentQueueId, provider_response: responseBody }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Falha da API Z-API
      const maxAttempts = 3;
      const shouldRetry = newAttempts < maxAttempts;

      await supabase
        .from("message_queue")
        .update({
          status: shouldRetry ? "pending" : "failed",
          attempts: newAttempts,
          provider_response: responseBody,
          error_message: `Z-API retornou ${response!.status}`,
          next_retry_at: shouldRetry
            ? new Date(Date.now() + newAttempts * 60000).toISOString()
            : null,
        })
        .eq("id", currentQueueId);

      return new Response(
        JSON.stringify({
          error: "Falha no envio",
          queue_id: currentQueueId,
          retry: shouldRetry,
          provider_response: responseBody,
        }),
        { status: response!.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err: any) {
    console.error("send-whatsapp error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
