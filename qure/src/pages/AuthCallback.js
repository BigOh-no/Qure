import { useEffect } from "react";
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
        if (role === "patient") navigate("/patient");
        else if (role === "admin") navigate("/admin");
        else if (role === "clinicstaff") navigate("/staff");
        else navigate("/");
      } catch (error) {
        console.error(error.message);
        navigate("/login");
      }
    };

    handleRedirect();
  }, [navigate]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoCircle}>
          <span style={styles.logoText}>Q</span>
        </div>

        <div style={styles.spinner}></div>

        <h2 style={styles.heading}>Logging you in</h2>
        <p style={styles.text}>
          Please wait while we securely redirect you to your dashboard.
        </p>
      </div>

      <style>
        {`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:
      "linear-gradient(135deg, #eef7f6 0%, #f7fbfb 45%, #e4f3f1 100%)",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
    padding: "20px",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#ffffff",
    borderRadius: "24px",
    padding: "42px 32px",
    textAlign: "center",
    boxShadow: "0 18px 45px rgba(0, 0, 0, 0.08)",
    border: "1px solid rgba(31, 122, 117, 0.12)",
  },
  logoCircle: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #1f7a75, #2aa198)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "0 auto 24px",
    boxShadow: "0 10px 25px rgba(31, 122, 117, 0.25)",
  },
  logoText: {
    color: "#ffffff",
    fontSize: "34px",
    fontWeight: "700",
    lineHeight: "1",
  },
  spinner: {
    width: "42px",
    height: "42px",
    border: "4px solid #d8eeee",
    borderTop: "4px solid #1f7a75",
    borderRadius: "50%",
    animation: "spin 0.9s linear infinite",
    margin: "0 auto 24px",
  },
  heading: {
    margin: "0 0 10px",
    fontSize: "24px",
    fontWeight: "700",
    color: "#1f2933",
  },
  text: {
    margin: "0",
    fontSize: "15px",
    lineHeight: "1.6",
    color: "#5f6f72",
  },
};

export default AuthCallback;