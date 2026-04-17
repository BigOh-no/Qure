import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseClient } from "../lib/supabaseClient";
import { getPatientAppointments } from "./appointmentService";
import "../styles/Patient.css";
import logo from "../assets/images/TLogo.png";

function PatientDashboard() {
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const [username, setUsername] = useState("Patient");
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentError, setAppointmentError] = useState("");

  const activeQueue = null;

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

  useEffect(() => {
    const loadPatientData = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabaseClient.auth.getUser();

        if (error) {
          throw error;
        }

        if (user) {
          let displayName =
  user.user_metadata?.full_name ||
  user.user_metadata?.name;

if (!displayName && user.email) {
  displayName = user.email.split("@")[0];
}

setUsername(displayName || "Patient");
        }

        const appointmentData = await getPatientAppointments();
        setAppointments(appointmentData);
      } catch (error) {
        console.error(error);
        setAppointmentError("Failed to load your appointments.");
      } finally {
        setLoadingAppointments(false);
      }
    };

    loadPatientData();
  }, []);

  const handleLogout = async () => {
    try {
      await supabaseClient.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error(error);
      navigate("/");
    }
  };

  return (
    <main className="patient-dashboard">
      <header className="dashboard-top">
        <img src={logo} alt="Qure logo" className="dashboard-logo" />

        <h1 className="dashboard-title">Hi, {username}</h1>

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
                onClick={handleLogout}
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
        <h2 className="section-title">Current Appointments</h2>

        {loadingAppointments && (
          <p className="empty-state">Loading appointments...</p>
        )}

        {appointmentError && (
          <p className="empty-state">{appointmentError}</p>
        )}

        {!loadingAppointments && !appointmentError && appointments.length === 0 ? (
          <p className="empty-state">No current appointments.</p>
        ) : null}

        {!loadingAppointments && !appointmentError && appointments.length > 0 && (
          <section className="appointments-list">
            {appointments.map((appt) => (
              <article className="appointment-card" key={appt.id}>
                <p>
                  <strong>Clinic:</strong>{" "}
                  {appt.clinics?.facility_name || "Unknown Clinic"}
                </p>
                <p>
                  <strong>Date:</strong> {appt.appointment_date}
                </p>
                <p>
                  <strong>Time:</strong>{" "}
                  {appt.appointment_time
                    ? appt.appointment_time.slice(0, 5)
                    : ""}
                </p>
                <p>
                  <strong>Status:</strong> {appt.status}
                </p>

                <footer className="card-actions">
                  <button className="secondary-btn" type="button">
                    Reschedule
                  </button>
                  <button className="secondary-btn" type="button">
                    Cancel
                  </button>
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
            <p>
              <strong>Clinic:</strong> {activeQueue.clinic}
            </p>
            <p>
              <strong>Queue Number:</strong> {activeQueue.queueNumber}
            </p>
            <p>
              <strong>Status:</strong> {activeQueue.status}
            </p>
            <p>
              <strong>Estimated Wait:</strong> {activeQueue.estimatedWait}
            </p>
          </article>
        )}
      </section>
    </main>
  );
}

export default PatientDashboard;