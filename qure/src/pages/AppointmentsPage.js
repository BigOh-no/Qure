import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ViewAppointments.css";

function AppointmentsPage() {
  const navigate = useNavigate();

  const appointments = [
    {
      id: 1,
      clinic: "Hillbrow Clinic",
      date: "2026-04-18",
      time: "09:00",
      status: "Booked",
    },
    {
      id: 2,
      clinic: "Soweto Clinic",
      date: "2026-04-22",
      time: "11:00",
      status: "Booked",
    },
  ];

  return (
    <main className="appointments-page">
      <header className="appointments-header">
        <section className="header-top">
          <h1 className="appointments-title">My Appointments</h1>

          <button
            className="back-btn"
            type="button"
            onClick={() => navigate("/patient")}
          >
            ← Back
          </button>
        </section>

        <p className="appointments-subtitle">
          View your upcoming appointments and manage them from here.
        </p>
      </header>

      <section className="appointments-section" aria-labelledby="appointments-heading">
        <h2 id="appointments-heading" className="section-title">
          Upcoming Appointments
        </h2>

        {appointments.length === 0 ? (
          <p className="empty-state">No appointments found.</p>
        ) : (
          <section className="appointments-list" aria-label="Appointments list">
            {appointments.map((appt) => (
              <article className="appointment-card" key={appt.id}>
                <p>
                  <strong>Clinic:</strong> {appt.clinic}
                </p>
                <p>
                  <strong>Date:</strong> {appt.date}
                </p>
                <p>
                  <strong>Time:</strong> {appt.time}
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
    </main>
  );
}

export default AppointmentsPage;