import { useEffect, useState } from "react";
import { supabaseClient } from "../lib/supabaseClient";

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabaseClient.auth.getSession();

        if (error) throw error;

        if (!data?.session) {
          setMessage("This reset link is invalid or expired.");
          return;
        }

        setReady(true);
      } catch (error) {
        setMessage(error.message || "Could not verify reset link.");
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const { error } = await supabaseClient.auth.updateUser({ password });

      if (error) throw error;

      setMessage("Password updated successfully. You can now log in.");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage(error.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: "420px", margin: "60px auto", padding: "1rem" }}>
      <h1>Set your password</h1>

      {message && <p>{message}</p>}

      {!ready ? (
        <p>Checking your reset link...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="password">New password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              style={{ width: "100%", padding: "0.6rem", marginTop: "0.3rem" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              style={{ width: "100%", padding: "0.6rem", marginTop: "0.3rem" }}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Set password"}
          </button>
        </form>
      )}
    </main>
  );
}

export default ResetPasswordPage;