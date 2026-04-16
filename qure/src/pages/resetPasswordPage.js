import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword } from '../lib/auth';
import '../styles/Admin.css';

function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      setIsSaving(true);
      await updatePassword(password);
      setSuccessMessage('Password updated successfully. You can now continue.');
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to update password.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="admin-page">
      <section
        className="admin-main"
        style={{
          maxWidth: '500px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <article className="dashboard-card" style={{ width: '100%' }}>
          <header className="admin-header">
            <h1>Set New Password</h1>
            <p>Enter your new password below.</p>
          </header>

          {successMessage && (
            <div className="admin-success-message">{successMessage}</div>
          )}

          {errorMessage && (
            <div className="admin-error-message">{errorMessage}</div>
          )}

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
                {isSaving ? 'Saving...' : 'Update Password'}
              </button>
            </footer>
          </form>
        </article>
      </section>
    </main>
  );
}

export default ResetPassword;