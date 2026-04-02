import React from "react"
import "./Signup.css"
import logo from "./logo.png"

function Signup(){
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
                <form className="signup-form">
                    <input
                        type = "email"
                        placeholder="name@gmail.com"
                        className="signup-input"
                    />
                    <input
                        type = "password"
                        placeholder="Create password"
                        className="signup-input"
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
                        Already have an account? <a href="/">Log in</a>
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