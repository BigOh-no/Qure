import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/staff.css";
import logo from "../assets/images/TLogo.png";

import {
  getStaffClinicAndQueue,
  updateQueueStatus,
  getClinicAppointments,
  staffCreateAppointment,
  staffCancelAppointment,
  staffRescheduleAppointment,
} from "./staffService";

export default function StaffDashboard() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [clinic, setClinic] = useState("");
  const [loading, setLoading] = useState(true);

  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  const [patientEmail, setPatientEmail] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");

  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  const [message, setMessage] = useState("");

  useEffect(() => {
    loadStaffQueue();
    loadAppointments();
  }, []);

  async function loadStaffQueue() {
    try {
      setLoading(true);

      const result = await getStaffClinicAndQueue();

      if (result) {
        setClinic(result.clinicName);
        setPatients(result.patients || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadAppointments() {
    try {
      setAppointmentsLoading(true);

      const data = await getClinicAppointments();
      setAppointments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAppointmentsLoading(false);
    }
  }

  function showMessage(text) {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  async function updateStatus(id, newStatus) {
    try {
      await updateQueueStatus(id, newStatus);
      var stat;
      if (newStatus === "in_consultation"){
        stat = "In Consultation";
      }
      else if (newStatus === "completed"){
        stat = "Completed";
      }
      else{
        stat = "Unknown"
      }
      setPatients((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status: stat } : p
        )
      );

      showMessage("Queue status updated successfully.");
    } catch (err) {
      console.error(err);
      showMessage("Could not update queue status.");
    }
  }

  async function handleCreateAppointment(e) {
    e.preventDefault();

    if (!patientEmail || !appointmentDate || !appointmentTime) {
      showMessage("Please fill in all appointment fields.");
      return;
    }

    try {
      const newAppointment = await staffCreateAppointment({
        patientEmail,
        appointmentDate,
        appointmentTime,
      });

      if (!newAppointment) {
        showMessage("Could not create appointment. Check the patient email.");
        return;
      }

      setAppointments((prev) => [...prev, newAppointment]);

      setPatientEmail("");
      setAppointmentDate("");
      setAppointmentTime("");

      await loadAppointments();

      showMessage("Appointment created successfully.");
    } catch (err) {
      console.error(err);
      showMessage("Could not create appointment.");
    }
  }

  async function handleCancelAppointment(appointmentId) {
    try {
      const updatedAppointment = await staffCancelAppointment(appointmentId);

      if (updatedAppointment) {
        setAppointments((prev) =>
          prev.map((appointment) =>
            appointment.id === appointmentId
              ? updatedAppointment
              : appointment
          )
        );
      }

      showMessage("Appointment cancelled successfully.");
    } catch (err) {
      console.error(err);
      showMessage("Could not cancel appointment.");
    }
  }

  function startReschedule(appointment) {
    setEditingAppointmentId(appointment.id);
    setRescheduleDate(appointment.appointment_date || "");
    setRescheduleTime(appointment.appointment_time || "");
  }

  function cancelReschedule() {
    setEditingAppointmentId(null);
    setRescheduleDate("");
    setRescheduleTime("");
  }

  async function handleRescheduleAppointment(appointmentId) {
    if (!rescheduleDate || !rescheduleTime) {
      showMessage("Please choose a new date and time.");
      return;
    }

    try {
      const updatedAppointment = await staffRescheduleAppointment({
        appointmentId,
        appointmentDate: rescheduleDate,
        appointmentTime: rescheduleTime,
      });

      if (updatedAppointment) {
        setAppointments((prev) =>
          prev.map((appointment) =>
            appointment.id === appointmentId
              ? updatedAppointment
              : appointment
          )
        );
      }

      cancelReschedule();

      showMessage("Appointment rescheduled successfully.");
    } catch (err) {
      console.error(err);
      showMessage("Could not reschedule appointment.");
    }
  }
  function getStatusName(status){
    if (status === "waiting"){
      return "Waiting";
    }
    else if (status === "in_consultation"){
      return "In Consultation";
    }
    else if (status === "completed"){
      return "Completed";
    }
    return status;
  }
  function getStatusClass(status) {
    const normalizedStatus = status?.toLowerCase();

    if (normalizedStatus === "waiting") return "status waiting";

    if (
      normalizedStatus === "in consultation" ||
      normalizedStatus === "in_consultation"
    ) {
      return "status progress";
    }

    if (
      normalizedStatus === "completed" ||
      normalizedStatus === "done"
    ) {
      return "status done";
    }

    if (normalizedStatus === "cancelled") {
      return "status cancelled";
    }

    if (normalizedStatus === "booked") {
      return "status progress";
    }

    return "status";
  }

  return (
    <main className="layout">
      <aside className="sidebar">
        <figure className="sidebar-logo-figure">
          <img src={logo} alt="Qure logo" className="sidebar-logo" />
        </figure>

        <nav className="nav" aria-label="Staff navigation">
          <section className="nav-top">
            <button type="button" className="nav-item active">
              Dashboard
            </button>

            <button
              type="button"
              className="nav-item"
              
            >
              Profile
            </button>
          </section>

          <footer className="nav-bottom">
            <button
              type="button"
              className="nav-item logout"
              onClick={() => navigate("/")}
            >
              Logout
            </button>
          </footer>
        </nav>
      </aside>

      <section className="main">
        <header className="topbar">
          <h1 className="topbar-title">Staff Dashboard</h1>
          <p className="topbar-subtitle">{clinic || "Loading..."}</p>
        </header>

        {message && <p className="success-message">{message}</p>}

        <article className="card">
          <header className="card-header">
            <h2>Today's Queue</h2>
            <p className="patient-count">
              <strong>{patients.length}</strong> patients
            </p>
          </header>

          <table className="table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4">Loading queue...</td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="4">No patients in queue</td>
                </tr>
              ) : (
                patients.map((entry, index) => (
                  <tr key={entry.id}>
                    <td>{entry.patient_name}</td>

                    <td>
                      {entry.joined_at
                        ? new Date(entry.joined_at).toLocaleString()
                        : "N/A"}
                    </td>

                    <td>
                      <strong className={getStatusClass(entry.status)}>
                        {getStatusName(entry.status)}
                      </strong>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btn start"
                        onClick={() =>
                          updateStatus(entry.id, "in_consultation")
                        }

                      >
                        Start
                      </button>

                      <button
                        type="button"
                        className="btn complete"
                        onClick={() =>
                          updateStatus(entry.id, "completed")
                        }
                      >
                        Complete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </article>

        <article className="card">
          <header className="card-header">
            <h2>Create Appointment</h2>
          </header>

          <form
            className="appointment-form"
            onSubmit={handleCreateAppointment}
          >
            <label>
              Patient Email
              <input
                type="email"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                placeholder="Enter patient email address"
              />
            </label>

            <label>
              Appointment Date
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
              />
            </label>

            <label>
              Appointment Time
              <input
                type="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
              />
            </label>

            <button type="submit" className="btn start">
              Create Appointment
            </button>
          </form>
        </article>

        <article className="card">
          <header className="card-header">
            <h2>Clinic Appointments</h2>
            <p className="patient-count">
              <strong>{appointments.length}</strong> appointments
            </p>
          </header>

          <table className="table">
            <thead>
              <tr>
                <th>Patient Email</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {appointmentsLoading ? (
                <tr>
                  <td colSpan="5">Loading appointments...</td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan="5">No appointments found</td>
                </tr>
              ) : (
                appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>{appointment.patient_email || "Email not found"}</td>

                    <td>
                      {editingAppointmentId === appointment.id ? (
                        <input
                          type="date"
                          value={rescheduleDate}
                          onChange={(e) =>
                            setRescheduleDate(e.target.value)
                          }
                        />
                      ) : (
                        appointment.appointment_date
                      )}
                    </td>

                    <td>
                      {editingAppointmentId === appointment.id ? (
                        <input
                          type="time"
                          value={rescheduleTime}
                          onChange={(e) =>
                            setRescheduleTime(e.target.value)
                          }
                        />
                      ) : (
                        appointment.appointment_time
                      )}
                    </td>

                    <td>
                      <strong className={getStatusClass(appointment.status)}>
                        {appointment.status}
                      </strong>
                    </td>

                    <td>
                      {editingAppointmentId === appointment.id ? (
                        <>
                          <button
                            type="button"
                            className="btn complete"
                            onClick={() =>
                              handleRescheduleAppointment(appointment.id)
                            }
                          >
                            Save
                          </button>

                          <button
                            type="button"
                            className="btn logout"
                            onClick={cancelReschedule}
                          >
                            Cancel Edit
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn start"
                            onClick={() => startReschedule(appointment)}
                          >
                            Reschedule
                          </button>

                          <button
                            type="button"
                            className="btn logout"
                            onClick={() =>
                              handleCancelAppointment(appointment.id)
                            }
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </article>
      </section>
    </main>
  );
}