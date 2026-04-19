import { useEffect, useRef, useState } from "react";
import { supabaseClient } from "../lib/supabaseClient";

export default function ForgotPassword({ isOpen, onClose, email: initialEmail }) {
    const [email] = useState(initialEmail || "");
    const [message, setMessage] = useState("");
    const dialogRef = useRef(null);

    useEffect(() => {
        const dialog = dialogRef.current;

        if (!dialog) return;

        if (isOpen) {
            dialog.showModal();
        } else {
            dialog.close();
        }
    }, [isOpen]);

    const handleReset = async (e) => {
        e.preventDefault();

        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            setMessage(error.message);
        } else {
            setMessage("Check your email for the reset link");
        }
    };

    return (
        <dialog ref={dialogRef} onCancel={onClose}>
            <article>
                <header>
                    <h2>Reset Password</h2>
                </header>

                <form onSubmit={handleReset}>
                    <p>
                        Reset link will be sent to: <strong>{email}</strong>
                    </p>

                    <footer>
                        <button type="submit">Send Reset Link</button>
                        <button type="button" onClick={onClose}>
                            Close
                        </button>
                    </footer>
                </form>

                {message && <output>{message}</output>}
            </article>
        </dialog>
    );
}