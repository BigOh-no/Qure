import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { updatePassword, ensureUserProfile, getUserRole } from "../lib/auth";
import { supabaseClient } from "../lib/supabaseClient";
import "../styles/Admin.css";

function ResetPasswordPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const {
        data: { session },
        error,
      } = await supabaseClient.auth.getSession();

      if (!mounted) return;

      if (error) {
        setErrorMessage("Could not verify invite session.");
        return;
      }

      if (session?.user) {
        setReady(true);
      } else {
        setErrorMessage("Your invite session is missing or expired.");
      }
    };

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (
        event === "PASSWORD_RECOVERY" ||
        event === "SIGNED_IN" ||
        event === "INITIAL_SESSION" ||
        event === "USER_UPDATED"
      ) {
        if (session?.user) {
          setErrorMessage("");
          setReady(true);
        }
      }
    });

    init();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setIsSaving(true);

      await updatePassword(password);

      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError || !user) {
        throw new Error("Could not load user after password update.");
      }

      await ensureUserProfile(user);

      const role = await getUserRole(user.id);

      setSuccessMessage("Password updated successfully.");

      setTimeout(() => {
        if (role === "admin") {
          navigate("/admin", { replace: true });
        } else if (role === "clinicstaff") {
          navigate("/staff", { replace: true });
        } else {
          navigate("/patient", { replace: true });
        }
      }, 1200);
    } catch (error) {
      setErrorMessage(error.message || "Failed to update password.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="admin-page">
      <section
        className="admin-main"
        style={{
          maxWidth: "500px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <article className="dashboard-card" style={{ width: "100%" }}>
          <header className="admin-header">
            <h1>Set New Password</h1>
            <p>Enter your new password below.</p>
          </header>

          {successMessage && (
            <p className="admin-success-message">{successMessage}</p>
          )}

          {errorMessage && (
            <p className="admin-error-message">{errorMessage}</p>
          )}

          {!ready && !errorMessage ? (
            <p>Verifying your invite link...</p>
          ) : ready ? (
            <form className="popup-form" onSubmit={handleSubmit}>
              <label className="popup-label" htmlFor="password">
                New Password
              </label>
              <input
                className="popup-input"
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />

              <label className="popup-label" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                className="popup-input"
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />

              <footer className="popup-footer">
                <button
                  type="submit"
                  className="save-btn"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Update Password"}
                </button>
              </footer>
            </form>
          ) : null}
        </article>
      </section>
    </main>
  );
}

export default ResetPasswordPage;