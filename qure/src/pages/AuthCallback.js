import { use, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { handleGoogleUser, getUserRole, loginGoogle } from "../lib/auth";

function AuthCallback() {
    const navigate = useNavigate();
     useEffect(() => {
        const handleRedirect = async () => {
            try {
              // After Google login, handle user data and insert into profiles if not already present
              const googleUser = await handleGoogleUser();
        
              // Get the user's role from their profile
              const role = await getUserRole(googleUser.email);
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