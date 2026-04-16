import {React, useEffect, useRef} from "react";
import { useNavigate} from "react-router-dom";
import "../styles/Patient.css";
import logo from "../assets/images/TLogo.png";

function PatientDashboard() {
  const navigate = useNavigate();
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

  const upcomingAppointments = [
    {
      id: 1,
      clinic: "Hillbrow Clinic",
      date: "2026-04-18",
      time: "09:00",
      status: "Booked",
    },
  ];

  const activeQueue = {
    clinic: "Soweto Clinic",
    queueNumber: 5,
    status: "Waiting",
    estimatedWait: "30 mins",
  };

  return (
    <main className="patient-dashboard">
      <header className="dashboard-top">
  
  
  <img src={logo} alt="Qure logo" className="dashboard-logo" />

  
  <h1 className="dashboard-title">Hi, USERNAME</h1>

 
  <aside className="dashboard-menu">
    <details className="menu-dropdown" ref={menuRef}>
      <summary className="menu-summary" aria-label="Open menu">
        <span className="menu-line"></span>
        <span className="menu-line"></span>
        <span className="menu-line"></span>
      </summary>

      <nav className="menu-panel">
        <button className="menu-item" type="button">
          Edit Profile
        </button>

        <button className="menu-item" type="button">
          View Clinics
        </button>

        <button
          className="menu-item logout-btn"
          type="button"
          onClick={() => navigate("/")}
        >
          Logout
        </button>
      </nav>
    </details>
  </aside>

</header>

      <nav className="dashboard-actions">
        <button
          className="action-btn"
          onClick={() => navigate("/patient/book")}
        >
          Book Appointment
        </button>

        <button
          className="action-btn"
          onClick={() => navigate("/patient/queue")}
        >
          Join Queue
        </button>

        <button
          className="action-btn"
          onClick={() => navigate("/patient/appointments")}
        >
          View All Appointments
        </button>
      </nav>

      <hr className="section-divider" />

      <section className="appointments-section">
        <h2 className="section-title">Upcoming Appointments</h2>

        {upcomingAppointments.length === 0 ? (
          <p className="empty-state">No upcoming appointments</p>
        ) : (
          <section className="appointments-list">
            {upcomingAppointments.map((appt) => (
              <article className="appointment-card" key={appt.id}>
                <p><strong>Clinic:</strong> {appt.clinic}</p>
                <p><strong>Date:</strong> {appt.date}</p>
                <p><strong>Time:</strong> {appt.time}</p>
                <p><strong>Status:</strong> {appt.status}</p>

                <footer className="card-actions">
                  <button className="secondary-btn">Reschedule</button>
                  <button className="secondary-btn">Cancel</button>
                </footer>
              </article>
            ))}
          </section>
        )}
      </section>

      <section className="queue-section">
        <h2 className="section-title">Current Queue</h2>

        {!activeQueue ? (
          <p className="empty-state">You are not in a queue</p>
        ) : (
          <article className="queue-card">
            <p><strong>Clinic:</strong> {activeQueue.clinic}</p>
            <p><strong>Queue Number:</strong> {activeQueue.queueNumber}</p>
            <p><strong>Status:</strong> {activeQueue.status}</p>
            <p><strong>Estimated Wait:</strong> {activeQueue.estimatedWait}</p>
          </article>
        )}
      </section>
    </main>
  );
}

export default PatientDashboard;