import { React, useState } from "react"
import "../styles/Signup.css"
import logo from "../assets/images/TLogo.png"
import { Link, useNavigate } from "react-router-dom";
import { signUp, loginGoogle } from "../lib/auth";
function Signup(){
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmpassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!email || !password || !confirmpassword) {
            setError('Please fill in all fields.');
            return;
        }

        if (password !== confirmpassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
              // Call the signup function from auth.js
            const user = await signUp(email, password);
            console.log('Signed up user:', user);
        
            if (user){
                setMessage("Signup Successful! Check your email and click confirm");
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
    return(
        <main className = "signup-page">
            <section className = "signup-left" aria-label = "Signup form section">
                <header className="signup-header">
                    <figure className="logo-figure">
                        <img src = {logo} alt = "Qure logo" className="signup-logo"/>
                    </figure>
                    <h1 className="signup-title">Create your Qure account</h1>
                    <p className = "signup-subtitle">Beat the queue with Qure. Sign up to get started</p>
                </header>
                <button type="button" className = "google-btn" onClick={handleGoogleLogin}>
                    Continue with Google
                </button>
                <hr className="divider-line"/>
                <p className="divider-txt">Or sign up with email</p>
                <form className="signup-form" onSubmit={handleSignup}>
                    <input
                        type = "email"
                        placeholder="email@gmail.com"
                        value = {email}
                        className="signup-input"
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type = "password"
                        placeholder="Create password"
                        value = {password}
                        className="signup-input"
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <input
                        type = "password"
                        placeholder="Confirm password"
                        value = {confirmpassword}
                        className="signup-input"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button type="submit" className="signup-btn">
                        Continue
                    </button>
                    {error && <p style={{ color: "red" }}>{error}</p>}
                    {message && <p style={{ color: "green" }}>{message}</p>}
                </form>
                <footer className = "signup-footer">
                    <p className="login-txt">
                        Already have an account? <Link to="/Login">Login</Link>
                    </p>
                </footer>
            </section>
            <aside className="signup-right" aria-label = "Qure information panel">
                <header className="right-header">
                    <h2 className="right-title">Healthcare, made faster</h2>
                    <p className="right-txt">
                        Join Qure and make booking, access and queue management simpler for both patients and staff.
                    </p>
                </header>

                <article className="info-card" aria-label = "Feature preview">
                    <ul className="feature-list">
                        <li className="feature-item light">Find the nearest clinic</li>
                        <li className="feature-item dark">Book appointments quickly</li>
                        <li className="feature-item light">Reduce waiting time</li>
                        <li className="feature-item dark">Manage queues easily</li>
                        <li className="feature-item light">Improve patient flow</li>
                    </ul>
                </article>

            </aside>
        </main>
    );
}
export default Signup;