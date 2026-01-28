/**
 * YESCLIN Accept Invite Edge Function
 * 
 * Handles invitation acceptance:
 * 1. Validates invitation token
 * 2. Creates user account (or links existing)
 * 3. Sets up profile and permissions
 * 4. Sends welcome email
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getEmailService } from "../_shared/email-service.ts";
import { generateWelcomeEmail } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AcceptInviteRequest {
  token: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting accept-invite function");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { token, password }: AcceptInviteRequest = await req.json();

    if (!token || !password) {
      return new Response(
        JSON.stringify({ error: "Token e senha são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter pelo menos 8 caracteres" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Looking for invitation with token");

    // Find the invitation
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from("user_invitations")
      .select("*")
      .eq("token", token)
      .eq("status", "pending")
      .single();

    if (inviteError || !invitation) {
      console.error("Invitation not found:", inviteError);
      return new Response(
        JSON.stringify({ error: "Convite não encontrado ou expirado" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Mark as expired
      await supabaseAdmin
        .from("user_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);

      return new Response(
        JSON.stringify({ error: "Este convite expirou. Solicite um novo convite ao administrador." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Invitation found:", invitation.id);

    // Check active users limit again
    const { data: activeProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact" })
      .eq("clinic_id", invitation.clinic_id)
      .eq("is_active", true);

    if ((activeProfiles?.length || 0) >= 3) {
      return new Response(
        JSON.stringify({ error: "Limite de usuários da clínica foi atingido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user with this email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(
      u => u.email?.toLowerCase() === invitation.email.toLowerCase()
    );

    let userId: string;

    if (existingUser) {
      // User exists - check if they're already in this clinic
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("user_id", existingUser.id)
        .eq("clinic_id", invitation.clinic_id)
        .single();

      if (existingProfile) {
        // Mark invitation as cancelled since user already exists
        await supabaseAdmin
          .from("user_invitations")
          .update({ status: "cancelled" })
          .eq("id", invitation.id);

        return new Response(
          JSON.stringify({ error: "Você já faz parte desta clínica" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      userId = existingUser.id;
      console.log("Using existing user:", userId);
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: invitation.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: invitation.full_name,
        },
      });

      if (createError || !newUser.user) {
        console.error("Error creating user:", createError);
        return new Response(
          JSON.stringify({ error: "Erro ao criar usuário" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      userId = newUser.user.id;
      console.log("Created new user:", userId);
    }

    // Create profile for the user
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: userId,
        clinic_id: invitation.clinic_id,
        full_name: invitation.full_name,
        is_active: true,
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // If it's a duplicate, user already has profile
      if (!profileError.message.includes("duplicate")) {
        return new Response(
          JSON.stringify({ error: "Erro ao criar perfil" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Create user role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        clinic_id: invitation.clinic_id,
        role: invitation.role,
      });

    if (roleError) {
      console.error("Error creating role:", roleError);
      if (!roleError.message.includes("duplicate")) {
        return new Response(
          JSON.stringify({ error: "Erro ao atribuir perfil" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Create module permissions if specified
    if (invitation.permissions && invitation.permissions.length > 0) {
      for (const module of invitation.permissions) {
        await supabaseAdmin.from("module_permissions").insert({
          user_id: userId,
          clinic_id: invitation.clinic_id,
          module: module,
          actions: ["view", "create", "edit"],
        });
      }
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabaseAdmin
      .from("user_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    if (updateError) {
      console.error("Error updating invitation:", updateError);
    }

    // Log the action
    await supabaseAdmin.from("user_audit_logs").insert({
      clinic_id: invitation.clinic_id,
      action: "user_joined",
      target_user_id: userId,
      target_email: invitation.email,
      performed_by: userId,
      details: {
        invitation_id: invitation.id,
        role: invitation.role,
        invited_by: invitation.invited_by,
      },
    });

    // Send welcome email (don't fail if email fails)
    try {
      const { data: clinic } = await supabaseAdmin
        .from("clinics")
        .select("name, logo_url")
        .eq("id", invitation.clinic_id)
        .single();

      const emailService = getEmailService();
      const baseUrl = req.headers.get("origin") || "https://yesclin.com";
      
      const emailHtml = generateWelcomeEmail({
        recipientName: invitation.full_name,
        clinicName: clinic?.name || undefined,
        clinicLogoUrl: clinic?.logo_url || undefined,
        loginUrl: `${baseUrl}/login`,
        role: invitation.role,
      });

      await emailService.send({
        to: invitation.email,
        subject: "Bem-vindo ao Yesclin! Seu acesso está pronto 🚀",
        html: emailHtml,
      });

      console.log("[accept-invite] Welcome email sent to:", invitation.email, "with role:", invitation.role);
    } catch (emailError) {
      console.error("[accept-invite] Failed to send welcome email:", emailError);
      // Don't fail the request - user activation is more important
    }

    console.log("[accept-invite] Invitation accepted successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Conta criada com sucesso! Você já pode fazer login.",
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("[accept-invite] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
