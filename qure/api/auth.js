import { supabase } from '../src/lib/supabaseClient.js';

export const verifyToken = async (req, res, next) => {
    try {
        const authheader = req.headers.authorization;
        if (!authheader) return res.status(401).json({ error: 'Missing token' });
        const token = authheader.split(' ')[1];
        const {data: user, error} = await supabase.auth.getUser(token);

        if (error || !user) return res.status(401).json({ error: 'Invalid token' });
        
        req.user = user;
        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error"});
    }
};

export const requireRole = (role) => async (req, res, next) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', req.user.id)
        .single();
    if (error || !role) return res.status(403).json({ error: "Role not found"});
    if (data.role !== role) return res.status(403).json({ error: "Forbidden"});

    next();
}

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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
};

export const getGoogleOAuthUrl = async () => {
    const { data, error } = await supabase.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${process.env.FRONTEND_URL}/auth/callback`
        }
    });
    if (error) throw error;
    return data.url;
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