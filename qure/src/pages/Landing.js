import React from "react"
import "../styles/Landing.css";
import logo from "../assets/images/TLogo.png";
import clinic from "../assets/images/Clinic.png";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();
  return (
    <main className="landing-page">
      
      <header className="header">
        <img src={logo} alt="Qure logo" className="header-logo" />

        <nav className="nav" aria-label="Primary navigation">
          <button 
            className="signin-btn" 
            type="button" 
            onClick={()=> navigate("/Login")}>
            Login
          </button>
        </nav>
      </header>

      {/* HERO WITH BACKGROUND IMAGE */}
      <section className="hero">
        <header className="hero-content">
          <h2 className="hero-title">
            Welcome to Qure
          </h2>
          <p className="hero-text">
            Tired of waiting in long queues at clinics? Qure is here to help you manage your appointments and reduce wait times.
          </p>
          <p className="hero-text">
            Beat the queue with Qure.
          </p>
          <button 
            className="cta-btn" 
            type="button"
            onClick={()=>navigate("/Signup")}>
            Get Started
          </button>
        </header>
      </section>

      <section className="features" aria-label="Website features">
        <article className="feature-card">
          <h3>No Queues</h3>
          <p>Book appointments in advance and avoid long waits.</p>
        </article>

        <article className="feature-card">
          <h3>Fast</h3>
          <p>Quick and Easy to book appointments.</p>
        </article>

        <article className="feature-card">
          <h3>Walk-Ins</h3>
          <p>Quick and easy way to join the virtual queue.</p>
        </article>
      </section>

      <footer className="footer">
        <p>© 2026 Qure. All rights reserved.</p>
      </footer>

    </main>
  );
}

export default LandingPage;