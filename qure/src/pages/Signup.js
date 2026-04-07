import { React, useState } from "react"
import "../styles/Signup.css"
import logo from "../assets/images/TLogo.png"
import { Link, useNavigate } from "react-router-dom";
import { signUp } from "../lib/auth";
function Signup(){
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields.');
            return;
        }
        try {
              // Call the signup function from auth.js
            const user = await signUp(email, password);
            console.log('Signed up user:', user);
        
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
                <button type="button" className = "google-btn">
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
                        className="signup-input"
                    />
                    <button type="submit" className="signup-btn">
                        Continue
                    </button>

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