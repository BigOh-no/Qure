import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseClient } from "../lib/supabaseClient";
import { ensureUserProfile } from "../lib/auth";

function AdminAuth() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying your invite link...");

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenHash = params.get("token_hash");
        const type = params.get("type");

        if (!tokenHash || !type) {
          setMessage("Invalid invite link.");
          return;
        }

        const { error: verifyError } = await supabaseClient.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });

        if (verifyError) {
          setMessage(verifyError.message || "Could not verify invite link.");
          return;
        }

        const {
          data: { user },
          error: userError,
        } = await supabaseClient.auth.getUser();

        if (userError || !user) {
          setMessage("Could not load invited user after verification.");
          return;
        }

        await ensureUserProfile(user);

        navigate("/reset-password", { replace: true });
      } catch (error) {
        setMessage(error.message || "Something went wrong.");
      }
    };

    run();
  }, [navigate]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f8f8f8",
      }}
    >
      <section
        style={{
          backgroundColor: "#ffffff",
          padding: "2rem",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
          maxWidth: "500px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <h1 style={{ color: "#8b0000", marginTop: 0 }}>Qure Admin Access</h1>
        <p style={{ color: "#555555", marginBottom: 0 }}>{message}</p>
      </section>
    </main>
  );
}

export default AdminAuth;