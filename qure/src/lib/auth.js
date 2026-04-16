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

export const getUserRole = async (userEmail) => {
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('email', userEmail)
        .single();
    if (error) throw error;
    if (!data?.role) return null;
    return data.role;
};

export const ensureUserProfile = async (user, role = 'patient') => {
  const { data: existingProfile, error } = await supabaseClient
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;

  if (!existingProfile) {
    const { error: insertError } = await supabaseClient
      .from('profiles')
      .insert([{
        id: user.id,
        email: user.email,
        role
      }]);

    if (insertError) throw insertError;
  }
};

export const createAdmin = async (email) => {
  const cleanEmail = email.trim().toLowerCase();

  const { data, error } = await supabaseClient.functions.invoke("create-admin", {
    body: {
      email: cleanEmail,
      redirectTo: `${window.location.origin}/reset-password`,
    },
  });

  if (error) {
    throw new Error(error.message || "Function returned an error");
  }

  if (!data?.success) {
    throw new Error(data?.error || "Failed to create admin");
  }

  return data;
};