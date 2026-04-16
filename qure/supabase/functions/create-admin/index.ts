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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase function secrets" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: userError?.message || "Unauthorized user" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const { data: callerProfile, error: profileError } = await userClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return new Response(
        JSON.stringify({ error: `Could not read caller profile: ${profileError.message}` }),
        { status: 403, headers: corsHeaders }
      );
    }

    if (callerProfile?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Only admins can add new admins" }),
        { status: 403, headers: corsHeaders }
      );
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const redirectTo =
      "https://purple-coast-06bb98010.6.azurestaticapps.net/auth/callback";

    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: { role: "admin" },
      });

    if (inviteError) {
      return new Response(
        JSON.stringify({ error: `Invite failed: ${inviteError.message}` }),
        { status: 400, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin invite sent successfully",
        invitedUserId: inviteData?.user?.id ?? null,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unexpected function error",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});