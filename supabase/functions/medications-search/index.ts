import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Types ──────────────────────────────────────────────────────────
export interface MedicationResult {
  nome_comercial: string;
  principio_ativo: string;
  forma_farmaceutica: string;
  concentracao: string;
  fabricante: string;
  registro_anvisa?: string;
  categoria?: string;
}

export interface MedicationSearchResponse {
  results: MedicationResult[];
  total: number;
  provider: string;
}

export interface MedicationProviderInterface {
  search(query: string): Promise<MedicationSearchResponse>;
}

// ── Mock Provider ──────────────────────────────────────────────────
const MOCK_DATA: MedicationResult[] = [
  { nome_comercial: "Amoxicilina 500mg", principio_ativo: "Amoxicilina", forma_farmaceutica: "Cápsula", concentracao: "500mg", fabricante: "EMS", registro_anvisa: "1234567890", categoria: "Antibiótico" },
  { nome_comercial: "Amoxicilina 875mg", principio_ativo: "Amoxicilina", forma_farmaceutica: "Comprimido", concentracao: "875mg", fabricante: "Medley", registro_anvisa: "1234567891", categoria: "Antibiótico" },
  { nome_comercial: "Dipirona Sódica 500mg", principio_ativo: "Dipirona Sódica", forma_farmaceutica: "Comprimido", concentracao: "500mg", fabricante: "Genérico", registro_anvisa: "9876543210", categoria: "Analgésico" },
  { nome_comercial: "Dipirona Gotas", principio_ativo: "Dipirona Sódica", forma_farmaceutica: "Solução Oral", concentracao: "500mg/mL", fabricante: "EMS", registro_anvisa: "9876543211", categoria: "Analgésico" },
  { nome_comercial: "Ibuprofeno 400mg", principio_ativo: "Ibuprofeno", forma_farmaceutica: "Comprimido", concentracao: "400mg", fabricante: "Aché", registro_anvisa: "5555555555", categoria: "Anti-inflamatório" },
  { nome_comercial: "Ibuprofeno 600mg", principio_ativo: "Ibuprofeno", forma_farmaceutica: "Comprimido", concentracao: "600mg", fabricante: "EMS", registro_anvisa: "5555555556", categoria: "Anti-inflamatório" },
  { nome_comercial: "Losartana Potássica 50mg", principio_ativo: "Losartana", forma_farmaceutica: "Comprimido", concentracao: "50mg", fabricante: "Genérico", registro_anvisa: "1111111111", categoria: "Anti-hipertensivo" },
  { nome_comercial: "Metformina 850mg", principio_ativo: "Cloridrato de Metformina", forma_farmaceutica: "Comprimido", concentracao: "850mg", fabricante: "Merck", registro_anvisa: "2222222222", categoria: "Antidiabético" },
  { nome_comercial: "Omeprazol 20mg", principio_ativo: "Omeprazol", forma_farmaceutica: "Cápsula", concentracao: "20mg", fabricante: "EMS", registro_anvisa: "3333333333", categoria: "Antiulceroso" },
  { nome_comercial: "Paracetamol 750mg", principio_ativo: "Paracetamol", forma_farmaceutica: "Comprimido", concentracao: "750mg", fabricante: "Genérico", registro_anvisa: "4444444444", categoria: "Analgésico" },
  { nome_comercial: "Prednisona 20mg", principio_ativo: "Prednisona", forma_farmaceutica: "Comprimido", concentracao: "20mg", fabricante: "EMS", registro_anvisa: "6666666666", categoria: "Corticosteroide" },
  { nome_comercial: "Sinvastatina 20mg", principio_ativo: "Sinvastatina", forma_farmaceutica: "Comprimido", concentracao: "20mg", fabricante: "Medley", registro_anvisa: "7777777777", categoria: "Hipolipemiante" },
];

class MockMedicationProvider implements MedicationProviderInterface {
  async search(query: string): Promise<MedicationSearchResponse> {
    const q = query.toLowerCase();
    const results = MOCK_DATA.filter(
      (m) =>
        m.nome_comercial.toLowerCase().includes(q) ||
        m.principio_ativo.toLowerCase().includes(q) ||
        (m.categoria?.toLowerCase().includes(q) ?? false),
    );
    return { results, total: results.length, provider: "mock" };
  }
}

// ── Service ────────────────────────────────────────────────────────
function resolveProvider(): MedicationProviderInterface {
  const provider = Deno.env.get("MEDICATION_PROVIDER") ?? "mock";
  switch (provider) {
    case "mock":
    default:
      return new MockMedicationProvider();
  }
}

class MedicationService {
  private provider: MedicationProviderInterface;
  constructor() {
    this.provider = resolveProvider();
  }
  async search(query: string): Promise<MedicationSearchResponse> {
    return this.provider.search(query);
  }
}

// ── Handler ────────────────────────────────────────────────────────
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
    const providerName = Deno.env.get("MEDICATION_PROVIDER") ?? "mock";

    // 1) Check cache
    const { data: cached } = await supabase
      .from("medication_api_cache")
      .select("response_json, expires_at")
      .eq("query_normalizada", queryNorm)
      .eq("provider", providerName)
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

    // 2) Use MedicationService (provider pattern)
    const service = new MedicationService();
    const searchResult = await service.search(queryNorm);

    // 3) Write to cache
    await supabase.from("medication_api_cache").insert({
      query_normalizada: queryNorm,
      provider: searchResult.provider,
      response_json: searchResult.results,
    });

    return new Response(
      JSON.stringify({
        data: searchResult.results,
        source: searchResult.provider,
        meta: { query: q, clinic_id: clinicId, user_id: user.id, total: searchResult.total },
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
