import { use, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserRole, ensureUserProfile } from "../lib/auth";
import { supabaseClient } from "../lib/supabaseClient";

function AuthCallback() {
    const navigate = useNavigate();
      useEffect(() => {
        const handleRedirect = async () => {
          try {
            // 1. Get session user (works for BOTH Google + email confirm)
            const { data, error } = await supabaseClient.auth.getSession();
            if (error) throw error;

            const user = data?.session?.user;
            if (!user) throw new Error("No user found");

            // 2. Ensure profile exists (single source of truth)
            await ensureUserProfile(user);

            // 3. Get role
            const role = await getUserRole(user.email);

            // 4. Redirect
            if (role === 'patient') navigate('/patient');
            else if (role === 'admin') navigate('/admin');
            else if (role === 'clinicstaff') navigate('/staff');
            else navigate('/');

          } catch (error) {
            console.error(error.message);
            navigate("/login");
          }
        };

        handleRedirect();
      }, [navigate]);

      

     return <p>Logging in...</p>
}

export default AuthCallback;