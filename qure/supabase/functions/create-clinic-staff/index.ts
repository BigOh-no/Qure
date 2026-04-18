import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: corsHeaders }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Server configuration missing" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const clinicId = Number(body?.clinicId);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!Number.isInteger(clinicId) || clinicId <= 0) {
      return new Response(
        JSON.stringify({ error: "Valid clinicId is required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Confirm clinic exists
    const { data: clinic, error: clinicError } = await adminClient
      .from("clinics")
      .select("id, facility_name")
      .eq("id", clinicId)
      .single();

    if (clinicError || !clinic) {
      return new Response(
        JSON.stringify({ error: "Selected clinic was not found" }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Invite the user and send email
    const redirectTo =
      "https://purple-coast-06bb98010.6.azurestaticapps.net/reset-password";

    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: {
          role: "clinicstaff",
        },
      });

    if (inviteError) {
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    const invitedUser = inviteData.user;
    if (!invitedUser?.id) {
      return new Response(
        JSON.stringify({ error: "Invite succeeded but no user id was returned" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Upsert into profiles
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert(
        {
          id: invitedUser.id,
          email,
          role: "clinicstaff",
        },
        { onConflict: "id" }
      );

    if (profileError) {
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Upsert into clinicStaff
    const { error: clinicStaffError } = await adminClient
      .from("clinicStaff")
      .upsert(
        {
          email,
          staff_id: invitedUser.id,
          clinic_id: clinic.id,
        },
        { onConflict: "staff_id,clinic_id" }
      );

    if (clinicStaffError) {
      return new Response(
        JSON.stringify({ error: clinicStaffError.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        email,
        clinicId: clinic.id,
        clinicName: clinic.facility_name,
        userId: invitedUser.id,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: corsHeaders }
    );
  }
});