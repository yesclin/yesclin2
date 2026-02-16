import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LEGAL_NOTICE =
  "As informações exibidas são apenas auxiliares. A prescrição é de responsabilidade exclusiva do profissional de saúde.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";

    if (q.length < 2) {
      return new Response(
        JSON.stringify({ error: "O parâmetro 'q' deve ter no mínimo 2 caracteres." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Auth
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("clinic_id")
      .eq("id", user.id)
      .single();

    const clinicId = profile?.clinic_id ?? null;
    const queryNorm = q.toLowerCase();

    // 1) Check cache
    const { data: cached } = await supabase
      .from("medication_api_cache")
      .select("response_json, expires_at")
      .eq("query_normalizada", queryNorm)
      .eq("provider", "internal")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      return new Response(
        JSON.stringify({
          data: cached.response_json,
          source: "cache",
          meta: { query: q, clinic_id: clinicId, user_id: user.id },
          legal_notice: LEGAL_NOTICE,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2) No cache hit — placeholder for future API integration
    const results: unknown[] = [];

    // 3) Write to cache
    await supabase.from("medication_api_cache").insert({
      query_normalizada: queryNorm,
      provider: "internal",
      response_json: results,
    });

    return new Response(
      JSON.stringify({
        data: results,
        source: "api",
        meta: { query: q, clinic_id: clinicId, user_id: user.id },
        legal_notice: LEGAL_NOTICE,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("medications-search error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
