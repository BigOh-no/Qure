import React from "react";
import { useNavigate } from "react-router-dom";

function PatientDashboard() {
  const navigate = useNavigate();

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
    <div>
      <h1>Patient Dashboard</h1>

      <div>
        <button onClick={() => navigate("/patient/book")}>
          Book Appointment
        </button>

        <button onClick={() => navigate("/patient/queue")}>
          Join Queue
        </button>

        <button onClick={() => navigate("/patient/appointments")}>
          View All Appointments
        </button>
      </div>

      <hr />

      <h2>Upcoming Appointments *fake data</h2>

      {upcomingAppointments.length === 0 ? (
        <p>No upcoming appointments</p>
      ) : (
        upcomingAppointments.map((appt) => (
          <div key={appt.id}>
            <p><strong>Clinic:</strong> {appt.clinic}</p>
            <p><strong>Date:</strong> {appt.date}</p>
            <p><strong>Time:</strong> {appt.time}</p>
            <p><strong>Status:</strong> {appt.status}</p>

            <button>Reschedule</button>
            <button>Cancel</button>

            <hr />
          </div>
        ))
      )}

      <h2>Current Queue</h2>

      {!activeQueue ? (
        <p>You are not in a queue</p>
      ) : (
        <div>
          <p><strong>Clinic:</strong> {activeQueue.clinic}</p>
          <p><strong>Queue Number:</strong> {activeQueue.queueNumber}</p>
          <p><strong>Status:</strong> {activeQueue.status}</p>
          <p><strong>Estimated Wait:</strong> {activeQueue.estimatedWait}</p>
        </div>
      )}
    </div>
  );
}

export default PatientDashboard;