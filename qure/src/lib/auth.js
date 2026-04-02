import { supabase } from './supabaseClient';

export const signUp = async (email, password, role='patient') => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (!data?.user) return null;

    const { error: profileError } = supabase
        .from('profiles')
        .insert([{id: data.user.id, email: data.user.email, role: role}]);
    if (profileError) throw profileError;
    
    return data.user;
};

export const login = async (email, password) => {
    const { data, error } = await supabase.auth.singInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
};

export const loginGoogle = async () => {
    const { data, error } = await supabase.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`
        }
    });
    if (error) throw error;
    return data.user;
};

export const handleGoogleUser = async (role='patient') => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data?.user) return null;

    const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();
    if (!existingProfile){
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{id: data.user.id, email: data.user.email, role: role}]);
        if (profileError) throw profileError;
    }
    
    return data.user;
}

export const getUserRole = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
    if (error) throw error;
    if (!data?.role) return null;
    return data.role;
};