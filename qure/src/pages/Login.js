import React, { useState } from "react";
import "../styles/Login.css";
import logo from '../assets/images/TLogo.png';
import { Link,useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { login, loginGoogle, getUserRole } from '../lib/auth';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import ForgotPassword from "./ForgotPassword";

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [forgotOpen, setForgotOpen] = useState(false);

    const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      // Call the login function from auth.js
      const user = await login(email, password);
      console.log('Logged in user:', user);

      // Get the user's role from the profile
      const role = await getUserRole(user.email);
      console.log('User role:', role);

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
      setError(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginGoogle(); // Trigger Google OAuth
    } catch (error) {
      setError(error.message);
    }
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
    <FcGoogle size={20} /> Continue with Google
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
                    <label className="password-wrapper">
    <input
        type={showPassword ? "text" : "password"}
        placeholder="Password"
        className="login-input"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
    />
    <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
        {showPassword ? <FaEyeSlash /> : <FaEye />}
    </span>
</label>
                    <p className="forgot-link">
                        <a
                            href="#"
                            className="forgot-link"
                            onClick={(e) => {
                                e.preventDefault();
                                setForgotOpen(true);
                            }}
                            aria-haspopup="dialog"
                            >
                            Forgot password?
                        </a>
                    </p>

                    <button type="submit" className="login-btn">Log In</button>
                </form>

                <footer className="login-footer">
                    <p className="signup-txt">
                        Don't have an account? <Link to="/Signup">Sign up</Link>
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
            <ForgotPassword
                isOpen={forgotOpen}
                onClose={() => setForgotOpen(false)}
                email={email}
            />
        </main>
    );
}

export default Login;