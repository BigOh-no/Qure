import React from "react";

function AppointmentsPage() {
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
    <div>
      <h1>My Appointments</h1>

      {appointments.length === 0 ? (
        <p>No appointments found.</p>
      ) : (
        appointments.map((appt) => (
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
    </div>
  );
}

export default AppointmentsPage;