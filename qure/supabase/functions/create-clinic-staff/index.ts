import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "METHOD_ERROR: Method not allowed." }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({
          error: "CONFIG_ERROR: Missing required environment variables.",
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "AUTH_ERROR: Missing authorization header." }),
        { status: 401, headers: corsHeaders }
      );
    }

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user: callerUser },
      error: callerUserError,
    } = await callerClient.auth.getUser();

    if (callerUserError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "AUTH_ERROR: Unauthorized caller." }),
        { status: 401, headers: corsHeaders }
      );
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: callerProfile, error: callerProfileError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", callerUser.id)
      .single();

    if (callerProfileError || !callerProfile) {
      return new Response(
        JSON.stringify({
          error: "PROFILE_CHECK_ERROR: Could not verify caller profile.",
        }),
        { status: 403, headers: corsHeaders }
      );
    }

    if (callerProfile.role !== "admin") {
      return new Response(
        JSON.stringify({
          error: "FORBIDDEN_ERROR: Admin access required.",
        }),
        { status: 403, headers: corsHeaders }
      );
    }

    const body = await req.json();

    const email = String(body?.email ?? "").trim().toLowerCase();
    const clinicId = Number(body?.clinicId);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "INPUT_ERROR: Email is required." }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!Number.isInteger(clinicId) || clinicId <= 0) {
      return new Response(
        JSON.stringify({ error: "INPUT_ERROR: Valid clinicId is required." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { data: clinic, error: clinicError } = await adminClient
      .from("clinics")
      .select("id, facility_name")
      .eq("id", clinicId)
      .single();

    if (clinicError || !clinic) {
      return new Response(
        JSON.stringify({
          error: "CLINIC_ERROR: Selected clinic was not found.",
        }),
        { status: 404, headers: corsHeaders }
      );
    }

    const redirectTo =
      "https://purple-coast-06bb98010.6.azurestaticapps.net/staff/auth/callback";

    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: {
          role: "clinicstaff",
          invite_kind: "staff",
        },
      });

    if (inviteError) {
      const message = inviteError.message?.toLowerCase() || "";

      if (message.includes("rate limit")) {
        return new Response(
          JSON.stringify({
            error:
              "Too many invite emails were sent recently. Please wait a few minutes and try again.",
          }),
          { status: 429, headers: corsHeaders }
        );
      }

      return new Response(
        JSON.stringify({
          error: `INVITE_ERROR: ${inviteError.message}`,
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const invitedUser = inviteData.user;

    if (!invitedUser?.id) {
      return new Response(
        JSON.stringify({
          error: "INVITE_ERROR: Invite succeeded but no user id was returned.",
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const { error: profileError } = await adminClient.from("profiles").upsert(
      {
        id: invitedUser.id,
        email,
        role: "clinicstaff",
      },
      {
        onConflict: "id",
      }
    );

    if (profileError) {
      return new Response(
        JSON.stringify({
          error: `PROFILE_UPSERT_ERROR: ${profileError.message}`,
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { error: clinicStaffError } = await adminClient
      .from("clinicStaff")
      .upsert(
        {
          email,
          staff_id: invitedUser.id,
          clinic_id: clinic.id,
        },
        {
          onConflict: "staff_id",
        }
      );

    if (clinicStaffError) {
      return new Response(
        JSON.stringify({
          error: `CLINICSTAFF_UPSERT_ERROR: ${clinicStaffError.message}`,
        }),
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
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";

    return new Response(
      JSON.stringify({ error: `UNEXPECTED_ERROR: ${message}` }),
      { status: 500, headers: corsHeaders }
    );
  }
});