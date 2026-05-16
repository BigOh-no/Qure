import { useState } from "react";
import { supabaseClient } from "../lib/supabaseClient";
import "../styles/Admin.css";

export default function ForgotPassword({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      return;
    }

    setMessage("");
    setIsSending(true);

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the reset link.");
      setEmail("");
    }

    setIsSending(false);
  };

  const handleClose = () => {
    setMessage("");
    setEmail("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <section className="admin-modal-overlay" onClick={handleClose}>
      <dialog
        className="popup-dialog"
        open
        onClick={(event) => event.stopPropagation()}
      >
        <form className="popup-form" onSubmit={handleReset}>
          <header className="popup-header">
            <h2>Reset Password</h2>
          </header>

          <label className="popup-label" htmlFor="resetEmail">
            Email Address
          </label>

          <input
            className="popup-input"
            id="resetEmail"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {message && (
            <p
              className={
                message.toLowerCase().includes("check your email")
                  ? "admin-success-message"
                  : "admin-error-message"
              }
            >
              {message}
            </p>
          )}

          <footer className="popup-footer">
            <button
              type="button"
              className="cancel-btn"
              onClick={handleClose}
              disabled={isSending}
            >
              Close
            </button>

            <button
              type="submit"
              className="save-btn"
              disabled={isSending}
            >
              {isSending ? "Sending..." : "Send Reset Link"}
            </button>
          </footer>
        </form>
      </dialog>
    </section>
  );
}