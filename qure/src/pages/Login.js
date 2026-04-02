import React, { useState } from "react";
import "./Login.css";
import logo from './logo.png';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields.');
            return;
        }

        console.log('Logging in with:', email, password);
        // TODO: Call backend and redirect by role
    };

    const handleGoogleLogin = () => {
        console.log('Google login triggered');
        // TODO: Trigger Google OAuth via backend
    };

    return (
        <main className="login-page">
            {/* LEFT PANEL - Login Form */}
            <section className="login-left" aria-label="Login form section">
                <header className="login-header">
                    <figure className="logo-figure">
    <img src={logo} alt="Qure logo" className="login-logo" />
</figure>
                    <h1 className="login-title">Welcome Back</h1>
                    <p className="login-subtitle">
                        Log in to manage your appointments and queue.
                    </p>
                </header>

                <button type="button" className="google-btn" onClick={handleGoogleLogin}>
                    Continue with Google
                </button>

                <hr className="divider-line"/>
                <p className="divider-txt">Or log in with email</p>

                <form className="login-form" onSubmit={handleLogin}>
                    {error && <p className="error-msg">{error}</p>}

                    <input
                        type="email"
                        placeholder="Email address"
                        className="login-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="login-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <p className="forgot-link">
                        <a href="/forgot-password">Forgot password?</a>
                    </p>

                    <button type="submit" className="login-btn">Log In</button>
                </form>

                <footer className="login-footer">
                    <p className="signup-txt">
                        Don't have an account? <a href="/signup">Sign up</a>
                    </p>
                </footer>
            </section>

            {/* RIGHT PANEL - Info */}
            <aside className="login-right" aria-label="Qure information panel">
                <header className="right-header">
                    <h2 className="right-title">Healthcare, made faster</h2>
                    <p className="right-txt">
                        Join Qure and make booking, access, and queue management simpler for both patients and staff.
                    </p>
                </header>

                <article className="info-card" aria-label="Feature preview">
                    <ul className="feature-list">
                        <li className="feature-item light"> Find the nearest clinic</li>
                        <li className="feature-item dark"> Book appointments quickly</li>
                        <li className="feature-item light">Reduce waiting time</li>
                        <li className="feature-item dark"> Manage queues easily</li>
                        <li className="feature-item light"> Improve patient flow</li>
                    </ul>
                </article>
            </aside>
        </main>
    );
}

export default Login;