import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CancelSaleRequest {
  sale_id: string;
  reason?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with service role for transaction
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's clinic
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("clinic_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile?.clinic_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Clínica não encontrada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clinicId = profile.clinic_id;
    const body: CancelSaleRequest = await req.json();
    const { sale_id, reason } = body;

    if (!sale_id) {
      return new Response(
        JSON.stringify({ success: false, error: "ID da venda é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[cancel-sale] Starting cancellation for sale ${sale_id} by user ${user.id}`);

    // ========================================
    // TRANSACTIONAL CANCELLATION
    // Using RPC to ensure atomicity
    // ========================================

    // Step 1: Get sale with items and verify ownership
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .select(`
        *,
        sale_items(*)
      `)
      .eq("id", sale_id)
      .eq("clinic_id", clinicId)
      .single();

    if (saleError || !sale) {
      console.error("[cancel-sale] Sale not found:", saleError);
      return new Response(
        JSON.stringify({ success: false, error: "Venda não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already canceled
    if (sale.status === "canceled" || sale.payment_status === "cancelado") {
      return new Response(
        JSON.stringify({ success: false, error: "Venda já está cancelada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date().toISOString();
    const saleItems = sale.sale_items || [];

    // Step 2: Update sale status
    const { error: updateSaleError } = await supabase
      .from("sales")
      .update({
        status: "canceled",
        payment_status: "cancelado",
        canceled_at: now,
        canceled_by: user.id,
        updated_at: now,
      })
      .eq("id", sale_id)
      .eq("clinic_id", clinicId);

    if (updateSaleError) {
      console.error("[cancel-sale] Failed to update sale:", updateSaleError);
      throw new Error("Falha ao atualizar status da venda");
    }

    console.log(`[cancel-sale] Sale ${sale_id} marked as canceled`);

    // Step 3: Revert stock for each item
    for (const item of saleItems) {
      // Get current product stock
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id, stock_quantity, name")
        .eq("id", item.product_id)
        .single();

      if (productError) {
        console.warn(`[cancel-sale] Product ${item.product_id} not found, skipping stock revert`);
        continue;
      }

      const previousQty = Number(product.stock_quantity) || 0;
      const returnQty = Number(item.quantity) || 0;
      const newQty = previousQty + returnQty;

      // Create stock movement for return
      const { error: movementError } = await supabase
        .from("stock_movements")
        .insert({
          clinic_id: clinicId,
          product_id: item.product_id,
          movement_type: "devolucao",
          quantity: returnQty,
          previous_quantity: previousQty,
          new_quantity: newQty,
          reason: reason || "Cancelamento de venda",
          reference_type: "sale",
          reference_id: sale_id,
          created_by: user.id,
        });

      if (movementError) {
        console.error("[cancel-sale] Failed to create stock movement:", movementError);
        throw new Error(`Falha ao registrar movimento de estoque para ${product.name}`);
      }

      // Update product stock
      const { error: stockUpdateError } = await supabase
        .from("products")
        .update({
          stock_quantity: newQty,
          updated_at: now,
        })
        .eq("id", item.product_id);

      if (stockUpdateError) {
        console.error("[cancel-sale] Failed to update product stock:", stockUpdateError);
        throw new Error(`Falha ao atualizar estoque do produto ${product.name}`);
      }

      console.log(`[cancel-sale] Stock reverted for product ${item.product_id}: ${previousQty} -> ${newQty}`);
    }

    // Step 4: Handle financial reversal
    // Check if there's a linked transaction
    if (sale.transaction_id) {
      // Mark original transaction as reversed
      const { error: txUpdateError } = await supabase
        .from("finance_transactions")
        .update({
          notes: `[ESTORNADO] ${sale.notes || ""} - Cancelamento em ${new Date().toLocaleDateString("pt-BR")}`,
          updated_at: now,
        })
        .eq("id", sale.transaction_id);

      if (txUpdateError) {
        console.warn("[cancel-sale] Failed to update original transaction:", txUpdateError);
      }
    }

    // Create reversal transaction
    const saleAmount = Number(sale.total_amount) || 0;
    if (saleAmount > 0) {
      const { error: reversalError } = await supabase
        .from("finance_transactions")
        .insert({
          clinic_id: clinicId,
          type: "saida",
          description: `Estorno - Cancelamento de venda #${sale_id.slice(0, 8)}`,
          amount: saleAmount,
          transaction_date: now.split("T")[0],
          payment_method: sale.payment_method || null,
          patient_id: sale.patient_id || null,
          professional_id: sale.professional_id || null,
          origin: "sale_cancellation",
          notes: `Estorno referente à venda cancelada. Motivo: ${reason || "Não informado"}. Venda original: ${sale_id}`,
          created_by: user.id,
        });

      if (reversalError) {
        console.error("[cancel-sale] Failed to create reversal transaction:", reversalError);
        throw new Error("Falha ao criar transação de estorno");
      }

      console.log(`[cancel-sale] Reversal transaction created for amount ${saleAmount}`);
    }

    // Step 5: Log audit entry
    try {
      await supabase.from("access_logs").insert({
        clinic_id: clinicId,
        user_id: user.id,
        action: "SALE_CANCELLED",
        resource: `sales/${sale_id}`,
        user_agent: req.headers.get("user-agent") || null,
      });
    } catch (auditError) {
      console.warn("[cancel-sale] Failed to log audit:", auditError);
      // Don't fail the operation for audit logging
    }

    console.log(`[cancel-sale] Successfully cancelled sale ${sale_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Venda cancelada com sucesso",
        sale_id,
        items_reverted: saleItems.length,
        amount_reversed: saleAmount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[cancel-sale] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro ao cancelar venda",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
