import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseClient } from "../lib/supabaseClient";

function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying your invite link...");

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenHash = params.get("token_hash");
        const type = params.get("type");
        const redirectTo = params.get("redirect_to");

        if (!tokenHash || !type) {
          setMessage("Invalid invite link.");
          return;
        }

        const { error } = await supabaseClient.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });

        if (error) {
          setMessage(error.message || "Could not verify invite link.");
          return;
        }

        navigate("/reset-password", {
          replace: true,
          state: { redirectTo: redirectTo || null },
        });
      } catch (error) {
        setMessage(error.message || "Something went wrong.");
      }
    };

    run();
  }, [navigate]);

  return (
    <main style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>Qure</h1>
      <p>{message}</p>
    </main>
  );
}

export default AuthCallback;