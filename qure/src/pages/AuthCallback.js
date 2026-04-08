import { use, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { handleGoogleUser, getUserRole, loginGoogle } from "../lib/auth";
import { supabaseClient } from "../lib/supabaseClient";

function AuthCallback() {
    const navigate = useNavigate();
     useEffect(() => {
        const handleRedirect = async () => {
            try {
              let user = null;

              const { data, error} = await supabaseClient.auth.getSession();
              if (error) throw error;
              
              if (data?.session?.user) {
                user = data.session.user;

                const { data: existingProfile } = await supabaseClient
                        .from('profiles')
                        .select('email')
                        .eq('email', user.email)
                        .single();

                    if (!existingProfile) {
                        const { error: profileError } = await supabaseClient
                            .from('profiles')
                            .insert([{
                                id: user.id,
                                email: user.email,
                                role: 'patient'
                            }]);

                        if (profileError) throw profileError;
                    }
              }
              //if the redirect is because of google auth instead of email confirmation
              if (!user) {
                user = await handleGoogleUser(); 
              }
              if (!user) {
                throw new Error("no user found"); 
              }
              // Get the user's role from their profile
              const role = await getUserRole(user.email);
              console.log('Google User role:', role);
        
              // Redirect user based on role
              if (role === 'patient') {
                navigate('/patient');
              } else if (role === 'admin') {
                navigate('/admin');
              } else if (role === 'clinicstaff'){
                navigate('/staff')
              }else {
                navigate('/');  // Default redirect if no role or unknown
              }
            } catch (error) {
              console.error(error.message);
              navigate("/login")
            }
          };

          handleRedirect();
     }, [navigate]);

     return <p>Logging in...</p>
}

export default AuthCallback;