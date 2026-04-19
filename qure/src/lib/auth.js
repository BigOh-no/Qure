import { supabaseClient } from './supabaseClient';

export const signUp = async (email, password, role='patient') => {
    const { data, error } = await supabaseClient.auth.signUp({ 
        email, 
        password, 
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) throw error;
    if (!data?.user) return null;

    // const { error: profileError } = await supabaseClient
    //     .from('profiles')
    //     .insert([{id: data.user.id, email: data.user.email, role: role}]);
    // if (profileError) throw profileError;
    
    return data.user;
};

export const login = async (email, password) => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
};

export const loginGoogle = async () => {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`
        }
    });
    if (error) throw error;
    return data;
};

export const handleGoogleUser = async (role='patient') => {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error) throw error;
    if (!data?.user) return null;

    const { data: existingProfile } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();
    if (!existingProfile){
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .insert([{id: data.user.id, email: data.user.email, role: role}]);
        if (profileError) throw profileError;
    }
    
    return data.user;
}

export const getUserRole = async (identifier) => {
  if (!identifier) {
    return null;
  }

  let query = supabaseClient
    .from("profiles")
    .select("role");

  const looksLikeUuid =
    typeof identifier === "string" &&
    /^[0-9a-fA-F-]{36}$/.test(identifier);

  if (looksLikeUuid) {
    query = query.eq("id", identifier);
  } else {
    query = query.eq("email", String(identifier).trim().toLowerCase());
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;

  return data?.role ?? null;
};

export const ensureUserProfile = async (user) => {
  const roleFromMetadata =
    user?.user_metadata?.role ||
    user?.app_metadata?.role ||
    "patient";

  const email = user?.email?.trim().toLowerCase();

  const { data, error } = await supabaseClient
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email,
        role: roleFromMetadata,
      },
      { onConflict: "id" }
    )
    .select()
    .maybeSingle();

  if (error) throw error;

  return data;
};

export const createAdminInvite = async (email) => {
  const cleanEmail = email.trim().toLowerCase();

  const {
    data: { session },
    error: sessionError,
  } = await supabaseClient.auth.getSession();

  if (sessionError) throw sessionError;
  if (!session) throw new Error("User not logged in");

  const { data, error } = await supabaseClient.functions.invoke("create-admin", {
    body: { email: cleanEmail },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  console.log("invoke data:", data);
  console.log("invoke error:", error);

  if (error) {
    let message = "Edge Function returned a non-2xx status code";

    if (error.message) {
      message = error.message;
    }

    if (error.context) {
      try {
        const text = await error.context.text();
        console.log("raw function error body:", text);

        if (text) {
          const parsed = JSON.parse(text);
          if (parsed?.error) {
            message = parsed.error;
          }
        }
      } catch (parseError) {
        console.log("could not parse function error body:", parseError);
      }
    }

    throw new Error(message);
  }

  if (!data?.success) {
    throw new Error(data?.error || "Failed to invite admin");
  }

  return data;
};

export const sendResetPasswordEmail = async (email) => {
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
};

export const updatePassword = async (newPassword) => {
  const { data, error } = await supabaseClient.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
};

export const logout = async () => {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
};