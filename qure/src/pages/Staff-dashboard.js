import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/staff.css";
import logo from "../assets/images/TLogo.png";
import { supabaseClient } from "../lib/supabaseClient";
import { generateHourlySlots, formatClinicHours } from "./slotUtils";

import {
  getStaffClinicAndQueue,
  updateQueueStatus,
  getClinicAppointments,
  staffCreateAppointment,
  staffCancelAppointment,
  staffRescheduleAppointment,
  staffCheckInAppointment,
} from "./staffService";

export default function StaffDashboard() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [clinic, setClinic] = useState("");
  const [clinicOpenTime, setClinicOpenTime] = useState(null);
  const [clinicCloseTime, setClinicCloseTime] = useState(null);
  const [loading, setLoading] = useState(true);

  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentFilter, setAppointmentFilter] = useState("today");

  const [patientEmail, setPatientEmail] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");

  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  const [message, setMessage] = useState("");

  const [staffName, setStaffName] = useState("Staff");
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const clinicSlots = generateHourlySlots(clinicOpenTime, clinicCloseTime, false);

  async function loadStaffName() {
    try {
      const {
        data: { user },
        error,
      } = await supabaseClient.auth.getUser();

      if (error) throw error;
      if (!user) return;

      let displayName = user.user_metadata?.full_name || user.user_metadata?.name;

      if (!displayName && user.email) {
        displayName = user.email.split("@")[0];
      }

      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("user_name")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Failed to fetch staff username:", profileError.message);
      }

      if (profile?.user_name) {
        setStaffName(profile.user_name);
        setNewUsername(profile.user_name);
      } else {
        setStaffName(displayName || "Staff");
        setNewUsername("");
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadStaffName();
    loadStaffQueue();
    loadAppointments();
  }, []);

  async function loadStaffQueue() {
    try {
      setLoading(true);

      const result = await getStaffClinicAndQueue();

      if (result) {
        setClinic(result.clinicName);
        setClinicOpenTime(result.open_t);
        setClinicCloseTime(result.closed_t);
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

      const visibleAppointments = (data || []).filter(
        (appointment) =>
          !hasAppointmentPassedByOneMonth(appointment.appointment_date)
      );

      setAppointments(visibleAppointments);
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

      let stat;

      if (newStatus === "in_consultation") {
        stat = "In Consultation";
      } else if (newStatus === "completed") {
        stat = "Completed";
      } else {
        stat = "Unknown";
      }

      setPatients((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: stat } : p))
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
      showMessage(err.message || "Could not create appointment.");
    }
  }

  function getAppointmentDateTime(appointmentDate, appointmentTime) {
    if (!appointmentDate || !appointmentTime) return null;

    return new Date(`${appointmentDate}T${appointmentTime}`);
  }

  function isSameDay(dateOne, dateTwo) {
    return (
      dateOne.getFullYear() === dateTwo.getFullYear() &&
      dateOne.getMonth() === dateTwo.getMonth() &&
      dateOne.getDate() === dateTwo.getDate()
    );
  }

  function isAppointmentToday(appointment) {
    const appointmentDateTime = getAppointmentDateTime(
      appointment.appointment_date,
      appointment.appointment_time
    );

    if (!appointmentDateTime) return false;

    return isSameDay(appointmentDateTime, new Date());
  }

  function isAppointmentInFutureDate(appointment) {
    if (!appointment.appointment_date) return false;

    const today = new Date();
    const appointmentDate = new Date(`${appointment.appointment_date}T00:00`);

    const todayDateOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    return appointmentDate > todayDateOnly;
  }

  function hasAppointmentTimePassed(appointmentDate, appointmentTime) {
    const appointmentDateTime = getAppointmentDateTime(
      appointmentDate,
      appointmentTime
    );

    if (!appointmentDateTime) return false;

    return appointmentDateTime < new Date();
  }

  function hasAppointmentPassedByOneMonth(appointmentDate) {
    if (!appointmentDate) return false;

    const appointmentDateOnly = new Date(appointmentDate);
    const oneMonthAfterAppointment = new Date(appointmentDateOnly);
    oneMonthAfterAppointment.setMonth(oneMonthAfterAppointment.getMonth() + 1);

    const now = new Date();

    return now > oneMonthAfterAppointment;
  }

  function isAppointmentCancelled(status) {
    return status?.toLowerCase().trim() === "cancelled";
  }

  function isAppointmentCheckedIn(status) {
    const normalizedStatus = status?.toLowerCase().trim();

    return normalizedStatus === "checked_in" || normalizedStatus === "checked in";
  }

  function isAppointmentPassed(appointment) {
    if (isAppointmentCancelled(appointment.status)) return false;

    return hasAppointmentTimePassed(
      appointment.appointment_date,
      appointment.appointment_time
    );
  }

  function canCheckInAppointment(appointment) {
    if (isAppointmentCancelled(appointment.status)) return false;
    if (isAppointmentCheckedIn(appointment.status)) return false;
    if (!isAppointmentToday(appointment)) return false;
    if (isAppointmentPassed(appointment)) return false;

    return true;
  }

  function canEditAppointment(appointment) {
    if (isAppointmentCancelled(appointment.status)) return false;
    if (isAppointmentPassed(appointment)) return false;

    return true;
  }

  async function handleCheckInAppointment(appointmentId) {
    try {
      const updatedAppointment = await staffCheckInAppointment(appointmentId);

      if (!updatedAppointment) {
        showMessage("Could not check in patient.");
        return;
      }

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === appointmentId
            ? {
                ...appointment,
                ...updatedAppointment,
              }
            : appointment
        )
      );

      await loadAppointments();

      showMessage("Patient checked in successfully.");
    } catch (err) {
      console.error(err);
      showMessage("Could not check in patient.");
    }
  }

  function getDerivedAppointmentStatus(appointment) {
    const normalizedStatus = appointment.status?.toLowerCase().trim();

    if (normalizedStatus === "cancelled") {
      return "Cancelled";
    }

    if (normalizedStatus === "checked_in" || normalizedStatus === "checked in") {
      return "Checked In";
    }

    if (isAppointmentPassed(appointment)) {
      return "Appointment Passed";
    }

    if (isAppointmentToday(appointment)) {
      return "Waiting To Be Seen";
    }

    return "Scheduled";
  }

  function getAppointmentCategory(appointment) {
    if (isAppointmentCancelled(appointment.status)) {
      return "cancelled";
    }

    if (isAppointmentPassed(appointment)) {
      return "passed";
    }

    if (isAppointmentToday(appointment)) {
      return "today";
    }

    if (isAppointmentInFutureDate(appointment)) {
      return "upcoming";
    }

    return "passed";
  }

  function getFilteredAppointments() {
    return appointments.filter((appointment) => {
      const category = getAppointmentCategory(appointment);

      if (appointmentFilter === "upcoming") return category === "upcoming";
      if (appointmentFilter === "today") return category === "today";
      if (appointmentFilter === "passed") return category === "passed";
      if (appointmentFilter === "cancelled") return category === "cancelled";
      if (appointmentFilter === "total") return true;

      return true;
    });
  }

  function getAppointmentFilterCount(filterValue) {
    return appointments.filter((appointment) => {
      const category = getAppointmentCategory(appointment);

      if (filterValue === "upcoming") return category === "upcoming";
      if (filterValue === "today") return category === "today";
      if (filterValue === "passed") return category === "passed";
      if (filterValue === "cancelled") return category === "cancelled";
      if (filterValue === "total") return true;

      return true;
    }).length;
  }

  function formatAppointmentTime(timeValue) {
    if (!timeValue) return "N/A";
    return String(timeValue).slice(0, 5);
  }

  async function handleCancelAppointment(appointmentId) {
    try {
      const updatedAppointment = await staffCancelAppointment(appointmentId);

      if (updatedAppointment) {
        setAppointments((prev) =>
          prev.map((appointment) =>
            appointment.id === appointmentId ? updatedAppointment : appointment
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
    setRescheduleTime(
      appointment.appointment_time ? appointment.appointment_time.slice(0, 5) : ""
    );
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
            appointment.id === appointmentId ? updatedAppointment : appointment
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

  function getStatusName(status) {
    if (status === "waiting") {
      return "Waiting";
    } else if (status === "in_consultation") {
      return "In Consultation";
    } else if (status === "completed") {
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

    if (normalizedStatus === "completed" || normalizedStatus === "done") {
      return "status done";
    }

    if (normalizedStatus === "cancelled") {
      return "status cancelled";
    }

    if (normalizedStatus === "checked in" || normalizedStatus === "checked_in") {
      return "status checked-in";
    }

    if (normalizedStatus === "scheduled") {
      return "status scheduled";
    }

    if (normalizedStatus === "appointment passed") {
      return "status passed";
    }

    if (normalizedStatus === "waiting to be seen") {
      return "status waiting";
    }

    return "status";
  }

  async function handleUsernameUpdate() {
    const trimmedUsername = newUsername.trim();

    if (!trimmedUsername) {
      setProfileError("Username cannot be empty.");
      return;
    }

    setProfileError("");
    setPasswordError("");
    setIsSavingUsername(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("No logged-in user found.");

      const { error } = await supabaseClient
        .from("profiles")
        .update({ user_name: trimmedUsername })
        .eq("id", user.id);

      if (error) throw error;

      setStaffName(trimmedUsername);
      setShowProfilePopup(false);
      showMessage("Username updated successfully.");
    } catch (err) {
      console.error("Failed to update username:", err.message);
      setProfileError("Failed to update username.");
    } finally {
      setIsSavingUsername(false);
    }
  }

  async function handlePasswordUpdate() {
    const trimmedPassword = newPassword.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    setProfileError("");
    setPasswordError("");

    if (!trimmedPassword || !trimmedConfirmPassword) {
      setPasswordError("Please enter and confirm your new password.");
      return;
    }

    if (trimmedPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsSavingPassword(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("No logged-in user found.");

      const { error } = await supabaseClient.auth.updateUser({
        password: trimmedPassword,
      });

      if (error) throw error;

      setNewPassword("");
      setConfirmPassword("");
      setShowProfilePopup(false);
      showMessage("Password updated successfully.");
    } catch (err) {
      console.error("Failed to update password:", err.message);
      setPasswordError(err.message || "Failed to update password.");
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function openProfilePopup() {
    setProfileError("");
    setPasswordError("");
    setNewPassword("");
    setConfirmPassword("");
    setShowProfilePopup(true);

    try {
      const {
        data: { user },
        error,
      } = await supabaseClient.auth.getUser();

      if (error) throw error;
      if (!user) return;

      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("user_name")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Failed to fetch profile username:", profileError.message);
      }

      setNewUsername(profile?.user_name || "");

      setTimeout(() => {
        setNewUsername(profile?.user_name || "");
      }, 100);
    } catch (err) {
      console.error(err);
      setNewUsername("");
    }
  }

  const filteredAppointments = getFilteredAppointments();

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
              onClick={openProfilePopup}
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
          <p className="topbar-subtitle">Welcome back, {staffName}</p>
          <p className="topbar-subtitle">{clinic || "Loading..."}</p>
          <p className="topbar-subtitle">
            Clinic hours: {formatClinicHours(clinicOpenTime, clinicCloseTime)}
          </p>
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
                patients.map((entry) => (
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
                        onClick={() => updateStatus(entry.id, "in_consultation")}
                      >
                        Start
                      </button>

                      <button
                        type="button"
                        className="btn complete"
                        onClick={() => updateStatus(entry.id, "completed")}
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

          <form className="appointment-form" onSubmit={handleCreateAppointment}>
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
              <select
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
              >
                <option value="">Select time</option>
                {clinicSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" className="btn start">
              Create Appointment
            </button>
          </form>
        </article>

        <article className="card">
          <header className="card-header appointments-header">
            <section>
              <h2>Clinic Appointments</h2>
              <p className="appointments-helper-text">
                View upcoming, today's, passed, cancelled, and total appointments.
              </p>
            </section>

            <p className="patient-count">
              <strong>{filteredAppointments.length}</strong> appointments
            </p>
          </header>

          <section className="appointment-filters" aria-label="Appointment filters">
            <button
              type="button"
              className={
                appointmentFilter === "upcoming"
                  ? "filter-btn active"
                  : "filter-btn"
              }
              onClick={() => setAppointmentFilter("upcoming")}
            >
              Upcoming ({getAppointmentFilterCount("upcoming")})
            </button>

            <button
              type="button"
              className={
                appointmentFilter === "today" ? "filter-btn active" : "filter-btn"
              }
              onClick={() => setAppointmentFilter("today")}
            >
              Today's Patients ({getAppointmentFilterCount("today")})
            </button>

            <button
              type="button"
              className={
                appointmentFilter === "passed" ? "filter-btn active" : "filter-btn"
              }
              onClick={() => setAppointmentFilter("passed")}
            >
              Passed ({getAppointmentFilterCount("passed")})
            </button>

            <button
              type="button"
              className={
                appointmentFilter === "cancelled"
                  ? "filter-btn active"
                  : "filter-btn"
              }
              onClick={() => setAppointmentFilter("cancelled")}
            >
              Cancelled ({getAppointmentFilterCount("cancelled")})
            </button>

            <button
              type="button"
              className={
                appointmentFilter === "total" ? "filter-btn active" : "filter-btn"
              }
              onClick={() => setAppointmentFilter("total")}
            >
              Total ({getAppointmentFilterCount("total")})
            </button>
          </section>

          {appointmentsLoading ? (
            <section className="appointments-empty-state">
              Loading appointments...
            </section>
          ) : filteredAppointments.length === 0 ? (
            <section className="appointments-empty-state">
              No appointments found for this filter.
            </section>
          ) : (
            <section className="appointments-scroll-list">
              {filteredAppointments.map((appointment) => {
                const derivedStatus = getDerivedAppointmentStatus(appointment);
                const checkInAllowed = canCheckInAppointment(appointment);
                const editAllowed = canEditAppointment(appointment);

                return (
                  <article className="appointment-list-card" key={appointment.id}>
                    <section className="appointment-list-main">
                      <section>
                        <p className="appointment-label">Patient Email</p>
                        <h3 className="appointment-patient-email">
                          {appointment.patient_email || "Email not found"}
                        </h3>
                      </section>

                      <section className="appointment-date-time-grid">
                        <section>
                          <p className="appointment-label">Date</p>

                          {editingAppointmentId === appointment.id ? (
                            <input
                              className="appointment-edit-input"
                              type="date"
                              value={rescheduleDate}
                              onChange={(e) => setRescheduleDate(e.target.value)}
                            />
                          ) : (
                            <p className="appointment-value">
                              {appointment.appointment_date}
                            </p>
                          )}
                        </section>

                        <section>
                          <p className="appointment-label">Time</p>

                          {editingAppointmentId === appointment.id ? (
                            <select
                              className="appointment-edit-input"
                              value={rescheduleTime}
                              onChange={(e) => setRescheduleTime(e.target.value)}
                            >
                              <option value="">Select time</option>
                              {clinicSlots.map((slot) => (
                                <option key={slot} value={slot}>
                                  {slot}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="appointment-value">
                              {formatAppointmentTime(
                                appointment.appointment_time
                              )}
                            </p>
                          )}
                        </section>
                      </section>
                    </section>

                    <section className="appointment-list-side">
                      <strong className={getStatusClass(derivedStatus)}>
                        {derivedStatus}
                      </strong>

                      <section className="appointment-actions">
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
                              className="btn check"
                              onClick={() =>
                                handleCheckInAppointment(appointment.id)
                              }
                              disabled={!checkInAllowed}
                            >
                              {isAppointmentCheckedIn(appointment.status)
                                ? "Checked In"
                                : "Check In"}
                            </button>

                            <button
                              type="button"
                              className="btn start"
                              onClick={() => startReschedule(appointment)}
                              disabled={!editAllowed}
                            >
                              Reschedule
                            </button>

                            <button
                              type="button"
                              className="btn logout"
                              onClick={() =>
                                handleCancelAppointment(appointment.id)
                              }
                              disabled={!editAllowed}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </section>
                    </section>
                  </article>
                );
              })}
            </section>
          )}
        </article>

        {showProfilePopup && (
          <section
            className="staff-modal-overlay"
            onClick={() => setShowProfilePopup(false)}
          >
            <section
              className="staff-profile-popup"
              onClick={(event) => event.stopPropagation()}
            >
              <header className="popup-header">
                <h2>Profile Settings</h2>
              </header>

              <input
                type="text"
                name="hiddenStaffUsername"
                autoComplete="username"
                tabIndex="-1"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "-9999px",
                  width: "1px",
                  height: "1px",
                  opacity: 0,
                }}
              />

              <input
                type="password"
                name="hiddenStaffPassword"
                autoComplete="current-password"
                tabIndex="-1"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "-9999px",
                  width: "1px",
                  height: "1px",
                  opacity: 0,
                }}
              />

              <section className="profile-option-card">
                <h3>Change Username</h3>

                <label className="popup-label" htmlFor="staffDisplayNameInput">
                  New Username
                </label>

                <input
                  className="popup-input"
                  id="staffDisplayNameInput"
                  name="staffDisplayNameInputNoAutoFill"
                  type="text"
                  placeholder="Enter new username"
                  value={newUsername}
                  autoComplete="new-password"
                  spellCheck="false"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  onChange={(event) => setNewUsername(event.target.value)}
                />

                {profileError && (
                  <p className="staff-error-message">{profileError}</p>
                )}

                <button
                  type="button"
                  className="save-btn"
                  onClick={handleUsernameUpdate}
                  disabled={isSavingUsername}
                >
                  {isSavingUsername ? "Updating..." : "Update Username"}
                </button>
              </section>

              <section className="profile-option-card">
                <h3>Change Password</h3>

                <label className="popup-label" htmlFor="staffNewPasswordInput">
                  New Password
                </label>

                <input
                  className="popup-input"
                  id="staffNewPasswordInput"
                  name="staffNewPasswordInputNoAutofill"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  onChange={(event) => setNewPassword(event.target.value)}
                />

                <label
                  className="popup-label"
                  htmlFor="staffConfirmPasswordInput"
                >
                  Confirm Password
                </label>

                <input
                  className="popup-input"
                  id="staffConfirmPasswordInput"
                  name="staffConfirmPasswordInputNoAutofill"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />

                {passwordError && (
                  <p className="staff-error-message">{passwordError}</p>
                )}

                <button
                  type="button"
                  className="save-btn"
                  onClick={handlePasswordUpdate}
                  disabled={isSavingPassword}
                >
                  {isSavingPassword ? "Updating..." : "Update Password"}
                </button>
              </section>

              <footer className="popup-footer">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowProfilePopup(false)}
                >
                  Close
                </button>
              </footer>
            </section>
          </section>
        )}
      </section>
    </main>
  );
}