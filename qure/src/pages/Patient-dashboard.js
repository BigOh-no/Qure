import React, { useEffect, useRef, useState } from "react";
import "../styles/Patient.css";

const PatientDashboard = () => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        menuRef.current.removeAttribute("open");
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);
return (
    <main className="patient-dashboard">
      <aside className="dashboard-menu">
        <details className="menu-dropdown" ref={menuRef}>
          <summary className="menu-summary" aria-label="Open dashboard menu">
              <hr className="menu-line" />
              <hr className="menu-line" />
              <hr className="menu-line" />
          </summary>

          <nav className="menu-panel" aria-label="Patient dashboard menu">
            <button className="menu-item" type="button">
              Edit Profile
            </button>

            <button className="menu-item" type="button">
              View Clinics
            </button>
          </nav>
        </details>
      </aside>

      <section className="dashboard-content">
        <header className="dashboard-header">
          <h1>Welcome back, USERNAME</h1>
          <button className="book-btn" type="button">
            Book Appointment
          </button>
        </header>

        <section
          className="appointments-section"
          aria-label="Current booked appointments"
        >
          <h2>Current Appointments</h2>

          <article className="appointment-card">
            <h3>Dr Smith</h3>
            <p>Date: 20 April 2026</p>
            <p>Time: 10:00 AM</p>
            <p>Clinic: Qure Medical Centre</p>
          </article>

          <article className="appointment-card">
            <h3>Dr Naidoo</h3>
            <p>Date: 25 April 2026</p>
            <p>Time: 2:30 PM</p>
            <p>Clinic: Qure Family Clinic</p>
          </article>
        </section>
      </section>
    </main>
  );
};

export default PatientDashboard;