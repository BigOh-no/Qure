import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseClient } from "../lib/supabaseClient";
import {
  getPatientAppointments,
  cancelAppointment,
  rescheduleAppointment,
  getBookedSlots,
  generateHourlySlots,
  isSlotWithinClinicHours,
  formatClinicHours,
} from "./appointmentService";
import {
  AVERAGE_CONSULTATION_MINUTES,
  calculateEstimatedWait,
  getMyActiveQueueStatusForToday,
  getTodayQueueForClinic,
} from "./queueService";
import "../styles/Patient.css";
import "../styles/Queue.css";
import logo from "../assets/images/TLogo.png";

function PatientDashboard() {
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const [username, setUsername] = useState("Patient");
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentError, setAppointmentError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [reschedulingId, setReschedulingId] = useState(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

  const [loadingQueue, setLoadingQueue] = useState(true);
  const [queueError, setQueueError] = useState("");
  const [activeQueueStatus, setActiveQueueStatus] = useState(null);
  const [activeQueueEntries, setActiveQueueEntries] = useState([]);
  const [myQueueEntry, setMyQueueEntry] = useState(null);
  const [leavingQueue, setLeavingQueue] = useState(false);

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotStatusMap, setSlotStatusMap] = useState({});
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

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

  const loadPatientData = async () => {
    try {
      setAppointmentError("");

      const {
        data: { user },
        error,
      } = await supabaseClient.auth.getUser();

      if (error) {
        throw error;
      }

      if (user) {
        let displayName =
          user.user_metadata?.full_name || user.user_metadata?.name;

        if (!displayName && user.email) {
          displayName = user.email.split("@")[0];
        }

        const { data: profile, error: profileError } = await supabaseClient
          .from("profiles")
          .select("user_name")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error(
            "Failed to fetch profile username:",
            profileError.message
          );
        }

        if (profile?.user_name) {
          setUsername(profile.user_name);
          setNewUsername(profile.user_name);
        } else {
          setUsername(displayName || "Patient");
          setNewUsername("");
        }
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

  const loadCurrentQueue = async () => {
    try {
      setLoadingQueue(true);
      setQueueError("");

      const activeStatus = await getMyActiveQueueStatusForToday();

      if (!activeStatus) {
        setActiveQueueStatus(null);
        setActiveQueueEntries([]);
        setMyQueueEntry(null);
        return;
      }

      const queueData = await getTodayQueueForClinic(
        activeStatus.entry.clinic_id
      );

      setActiveQueueStatus(activeStatus);
      setActiveQueueEntries(queueData || []);
      setMyQueueEntry(activeStatus.entry);
    } catch (error) {
      console.error(error);
      setQueueError("Failed to load your current queue.");
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    loadPatientData();
    loadCurrentQueue();
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

  const openCancelModal = (appointment) => {
    setAppointmentToCancel(appointment);
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setAppointmentToCancel(null);
    setShowCancelModal(false);
  };

  const handleCancelAppointment = async () => {
    if (!appointmentToCancel) {
      return;
    }

    try {
      setCancellingId(appointmentToCancel.id);
      setAppointmentError("");

      await cancelAppointment(appointmentToCancel.id);

      setAppointments((currentAppointments) =>
        currentAppointments.filter((appt) => appt.id !== appointmentToCancel.id)
      );

      closeCancelModal();
      setSuccessMessage("Appointment cancelled successfully.");
      setShowSuccessPopup(true);
    } catch (error) {
      console.error(error);
      setAppointmentError(error.message || "Failed to cancel appointment.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleLeaveQueue = async () => {
    if (!myQueueEntry?.id) {
      setQueueError("Could not find your active queue entry.");
      return;
    }

    try {
      setLeavingQueue(true);
      setQueueError("");

      const { error } = await supabaseClient
        .from("queue_entries")
        .update({ status: "cancelled" })
        .eq("id", myQueueEntry.id);

      if (error) {
        throw error;
      }

      setActiveQueueStatus(null);
      setActiveQueueEntries([]);
      setMyQueueEntry(null);

      setSuccessMessage("You have left the queue successfully.");
      setShowSuccessPopup(true);
    } catch (error) {
      console.error(error);
      setQueueError(error.message || "Failed to leave the queue.");
    } finally {
      setLeavingQueue(false);
    }
  };

  const openRescheduleModal = (appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleDate(appointment.appointment_date);
    setSelectedSlot("");
    setAvailableSlots([]);
    setSlotStatusMap({});
    setRescheduleError("");
    setShowRescheduleModal(true);
  };

  const closeRescheduleModal = () => {
    setShowRescheduleModal(false);
    setSelectedAppointment(null);
    setRescheduleDate("");
    setAvailableSlots([]);
    setSlotStatusMap({});
    setSelectedSlot("");
    setLoadingSlots(false);
    setRescheduleError("");
  };

  const loadAvailableSlots = async (appointment, newDate) => {
    try {
      setLoadingSlots(true);
      setRescheduleError("");
      setAvailableSlots([]);
      setSlotStatusMap({});
      setSelectedSlot("");

      const today = new Date().toISOString().split("T")[0];

      if (!newDate) {
        return;
      }

      if (newDate < today) {
        setRescheduleError("Please choose today or a future date.");
        return;
      }

      const bookedSlots =
        (await getBookedSlots(appointment.clinic_id, newDate)) || [];

      const currentTime = appointment.appointment_time?.slice(0, 5) || "";
      const allSlots = generateHourlySlots(
        appointment.clinics?.open_t,
        appointment.clinics?.closed_t,
        true
      );
      const now = new Date();

      const statusMap = {};

      allSlots.forEach((slot) => {
        const slotDateTime = new Date(`${newDate}T${slot}`);
        const isCurrentAppointmentSlot =
          newDate === appointment.appointment_date && slot === currentTime;

        const isClosed = !isSlotWithinClinicHours(
          slot,
          appointment.clinics?.open_t,
          appointment.clinics?.closed_t
        );

        if (isClosed) {
          statusMap[slot] = "closed";
        } else if (slotDateTime < now) {
          statusMap[slot] = isCurrentAppointmentSlot ? "current" : "past";
        } else if (isCurrentAppointmentSlot) {
          statusMap[slot] = "current";
        } else if (bookedSlots.includes(slot)) {
          statusMap[slot] = "booked";
        } else {
          statusMap[slot] = "available";
        }
      });

      setAvailableSlots(allSlots);
      setSlotStatusMap(statusMap);
    } catch (error) {
      console.error(error);
      setRescheduleError("Failed to load available slots.");
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (showRescheduleModal && selectedAppointment && rescheduleDate) {
      loadAvailableSlots(selectedAppointment, rescheduleDate);
    }
  }, [showRescheduleModal, selectedAppointment, rescheduleDate]);

  const handleSlotSelect = (slot) => {
    const status = slotStatusMap[slot];

    if (status === "booked" || status === "past" || status === "closed") {
      return;
    }

    setSelectedSlot(slot);
    setRescheduleError("");
  };

  const handleConfirmReschedule = async () => {
    if (!selectedAppointment) {
      return;
    }

    if (!rescheduleDate) {
      setRescheduleError("Please choose a date.");
      return;
    }

    if (!selectedSlot) {
      setRescheduleError("Please choose a time slot.");
      return;
    }

    const slotStatus = slotStatusMap[selectedSlot];

    if (
      slotStatus === "booked" ||
      slotStatus === "past" ||
      slotStatus === "closed"
    ) {
      setRescheduleError("Please choose a valid available time slot.");
      return;
    }

    try {
      setReschedulingId(selectedAppointment.id);
      setRescheduleError("");

      await rescheduleAppointment({
        appointmentId: selectedAppointment.id,
        clinicId: selectedAppointment.clinic_id,
        appointmentDate: rescheduleDate,
        appointmentTime: selectedSlot,
      });

      setAppointments((currentAppointments) =>
        currentAppointments
          .map((appt) =>
            appt.id === selectedAppointment.id
              ? {
                  ...appt,
                  appointment_date: rescheduleDate,
                  appointment_time: selectedSlot,
                  status: "booked",
                }
              : appt
          )
          .sort((a, b) => {
            const aDate = new Date(
              `${a.appointment_date}T${a.appointment_time}`
            );
            const bDate = new Date(
              `${b.appointment_date}T${b.appointment_time}`
            );
            return aDate - bDate;
          })
      );

      closeRescheduleModal();
      setSuccessMessage("Appointment rescheduled successfully.");
      setShowSuccessPopup(true);
    } catch (error) {
      console.error(error);

      if (error.code === "23505") {
        setRescheduleError(
          "That slot has already been booked. Please choose another one."
        );
      } else {
        setRescheduleError(error.message || "Failed to reschedule appointment.");
      }
    } finally {
      setReschedulingId(null);
    }
  };

  const myQueuePosition = myQueueEntry
    ? activeQueueEntries.findIndex((entry) => entry.id === myQueueEntry.id) + 1
    : null;

  const safeMyQueuePosition =
    myQueuePosition && myQueuePosition > 0
      ? myQueuePosition
      : activeQueueStatus?.position || null;

  const myEstimatedWait =
    safeMyQueuePosition !== null
      ? calculateEstimatedWait(safeMyQueuePosition)
      : activeQueueStatus?.estimatedWait || 0;

  const handleUsernameUpdate = async () => {
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

      setUsername(trimmedUsername);
      setSuccessMessage("Username updated successfully.");
      setShowSuccessPopup(true);
      setShowProfilePopup(false);
    } catch (error) {
      console.error("Failed to update username:", error.message);
      setProfileError("Failed to update username.");
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handlePasswordUpdate = async () => {
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
      setSuccessMessage("Password updated successfully.");
      setShowSuccessPopup(true);
      setShowProfilePopup(false);
    } catch (error) {
      console.error("Failed to update password:", error.message);
      setPasswordError(error.message || "Failed to update password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const openProfilePopup = async () => {
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
        console.error(
          "Failed to fetch profile username:",
          profileError.message
        );
      }

      setNewUsername(profile?.user_name || "");

      setTimeout(() => {
        setNewUsername(profile?.user_name || "");
      }, 100);
    } catch (error) {
      console.error(error);
      setNewUsername("");
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
              <button
                className="menu-item"
                type="button"
                onClick={() => {
                  openProfilePopup();
                  menuRef.current?.removeAttribute("open");
                }}
              >
                Edit Profile
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

        {appointmentError && <p className="empty-state">{appointmentError}</p>}

        {!loadingAppointments &&
        !appointmentError &&
        appointments.length === 0 ? (
          <p className="empty-state">No current appointments.</p>
        ) : null}

        {!loadingAppointments &&
        !appointmentError &&
        appointments.length > 0 ? (
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
                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={() => openRescheduleModal(appt)}
                    disabled={
                      reschedulingId === appt.id || cancellingId === appt.id
                    }
                  >
                    {reschedulingId === appt.id
                      ? "Rescheduling..."
                      : "Reschedule"}
                  </button>

                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={() => openCancelModal(appt)}
                    disabled={
                      cancellingId === appt.id || reschedulingId === appt.id
                    }
                  >
                    {cancellingId === appt.id ? "Cancelling..." : "Cancel"}
                  </button>
                </footer>
              </article>
            ))}
          </section>
        ) : null}
      </section>

      <section className="queue-section">
        <h2 className="section-title">Current Queue</h2>

        {loadingQueue && <p className="empty-state">Loading queue...</p>}

        {queueError && <p className="empty-state">{queueError}</p>}

        {!loadingQueue && !queueError && !activeQueueStatus ? (
          <p className="empty-state">You are not in a queue.</p>
        ) : null}

        {!loadingQueue && !queueError && activeQueueStatus ? (
          <section className="selected-queue-section">
            <h3 className="section-title">
              {activeQueueStatus.clinic?.facility_name || "Clinic"} Queue
            </h3>

            <section className="queue-info-card">
              <p>
                <strong>Queue hours:</strong>{" "}
                {formatClinicHours(
                  activeQueueStatus.clinic?.open_t,
                  activeQueueStatus.clinic?.closed_t
                )}
              </p>

              <p>
                <strong>Average consultation time:</strong>{" "}
                {AVERAGE_CONSULTATION_MINUTES} minutes
              </p>

              <p>
                <strong>Current queue length:</strong>{" "}
                {activeQueueEntries.length}
              </p>
            </section>

            <section className="visual-queue">
              {activeQueueEntries.length === 0 ? (
                <p className="empty-queue-message">
                  The queue is empty right now.
                </p>
              ) : (
                activeQueueEntries.map((entry, index) => {
                  const isMe = myQueueEntry?.id === entry.id;

                  return (
                    <article
                      key={entry.id}
                      className={`queue-person-card ${
                        isMe ? "queue-person-you" : ""
                      }`}
                    >
                      <section className="queue-position-number">
                        {index + 1}
                      </section>

                      <section>
                        <p className="queue-person-label">
                          {isMe ? "You" : `Patient ${index + 1}`}
                        </p>
                        <p className="queue-person-status">{entry.status}</p>
                      </section>
                    </article>
                  );
                })
              )}
            </section>

            <section className="queue-action-card">
              <p>
                <strong>Your current position:</strong>{" "}
                {safeMyQueuePosition || "Unknown"}
              </p>

              <p>
                <strong>Your estimated wait time:</strong> {myEstimatedWait}{" "}
                minutes
              </p>

              <p>
                <strong>Your status:</strong>{" "}
                {myQueueEntry?.status || "waiting"}
              </p>

              <button
                className="queue-button"
                type="button"
                onClick={handleLeaveQueue}
                disabled={leavingQueue}
              >
                {leavingQueue ? "Leaving Queue..." : "Leave Queue"}
              </button>
            </section>
          </section>
        ) : null}
      </section>

      {showCancelModal && (
        <section className="modal-overlay" onClick={closeCancelModal}>
          <section
            className="success-popup"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="success-popup-title">Cancel Appointment</h3>

            <p className="success-popup-text">
              Are you sure you want to cancel this appointment?
            </p>

            <p className="success-popup-text">
              <strong>Clinic:</strong>{" "}
              {appointmentToCancel?.clinics?.facility_name || "Unknown Clinic"}
            </p>

            <p className="success-popup-text">
              <strong>Date:</strong> {appointmentToCancel?.appointment_date}
            </p>

            <p className="success-popup-text">
              <strong>Time:</strong>{" "}
              {appointmentToCancel?.appointment_time
                ? appointmentToCancel.appointment_time.slice(0, 5)
                : ""}
            </p>

            <section className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={closeCancelModal}
                disabled={cancellingId === appointmentToCancel?.id}
              >
                Close
              </button>

              <button
                type="button"
                className="action-btn"
                onClick={handleCancelAppointment}
                disabled={cancellingId === appointmentToCancel?.id}
              >
                {cancellingId === appointmentToCancel?.id
                  ? "Cancelling..."
                  : "Confirm Cancel"}
              </button>
            </section>
          </section>
        </section>
      )}

      {showRescheduleModal && (
        <section className="modal-overlay" onClick={closeRescheduleModal}>
          <section
            className="reschedule-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="modal-title">Reschedule Appointment</h3>

            <p className="modal-clinic-name">
              {selectedAppointment?.clinics?.facility_name || "Clinic"}
            </p>

            <p className="modal-clinic-name">
              Clinic hours:{" "}
              {formatClinicHours(
                selectedAppointment?.clinics?.open_t,
                selectedAppointment?.clinics?.closed_t
              )}
            </p>

            <label className="modal-label" htmlFor="reschedule-date">
              Choose a new date
            </label>

            <input
              id="reschedule-date"
              type="date"
              className="modal-date-input"
              value={rescheduleDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(event) => setRescheduleDate(event.target.value)}
            />

            <section className="modal-slots-section">
              <p className="modal-label">Choose a time slot</p>

              {loadingSlots ? (
                <p className="modal-info">Loading slots...</p>
              ) : availableSlots.length > 0 ? (
                <section className="slot-grid">
                  {availableSlots.map((slot) => {
                    const status = slotStatusMap[slot];
                    const isSelected = selectedSlot === slot;
                    const isDisabled =
                      status === "booked" ||
                      status === "past" ||
                      status === "closed";

                    return (
                      <button
                        key={slot}
                        type="button"
                        className={`slot-btn ${
                          status === "booked" || status === "closed"
                            ? "slot-btn-booked"
                            : ""
                        } ${status === "past" ? "slot-btn-past" : ""} ${
                          status === "current" ? "slot-btn-current" : ""
                        } ${isSelected ? "slot-btn-active" : ""}`}
                        onClick={() => handleSlotSelect(slot)}
                        disabled={isDisabled}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </section>
              ) : (
                <p className="modal-info">No slots found for this date.</p>
              )}
            </section>

            {rescheduleError && (
              <p className="modal-error">{rescheduleError}</p>
            )}

            <section className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={closeRescheduleModal}
                disabled={reschedulingId === selectedAppointment?.id}
              >
                Close
              </button>

              <button
                type="button"
                className="action-btn"
                onClick={handleConfirmReschedule}
                disabled={
                  reschedulingId === selectedAppointment?.id ||
                  !selectedSlot ||
                  slotStatusMap[selectedSlot] === "booked" ||
                  slotStatusMap[selectedSlot] === "past" ||
                  slotStatusMap[selectedSlot] === "closed"
                }
              >
                {reschedulingId === selectedAppointment?.id
                  ? "Saving..."
                  : "Confirm"}
              </button>
            </section>
          </section>
        </section>
      )}

      {showProfilePopup && (
        <section
          className="modal-overlay"
          onClick={() => setShowProfilePopup(false)}
        >
          <section
            className="profile-popup"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="success-popup-title">Edit Profile</h3>

            <input
              type="text"
              name="hiddenPatientUsername"
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
              name="hiddenPatientPassword"
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
              <h4>Change Username</h4>

              <label className="modal-label" htmlFor="patientDisplayNameInput">
                New Username
              </label>

              <input
                className="modal-date-input"
                id="patientDisplayNameInput"
                name="patientDisplayNameInputNoAutoFill"
                type="text"
                placeholder="Enter new username"
                value={newUsername}
                autoComplete="new-password"
                spellCheck="false"
                data-lpignore="true"
                data-1p-ignore="true"
                onChange={(event) => setNewUsername(event.target.value)}
              />

              {profileError && <p className="modal-error">{profileError}</p>}

              <button
                type="button"
                className="action-btn"
                onClick={handleUsernameUpdate}
                disabled={isSavingUsername}
              >
                {isSavingUsername ? "Updating..." : "Update Username"}
              </button>
            </section>

            <section className="profile-option-card">
              <h4>Change Password</h4>

              <label className="modal-label" htmlFor="patientNewPasswordInput">
                New Password
              </label>

              <input
                className="modal-date-input"
                id="patientNewPasswordInput"
                name="patientNewPasswordInputNoAutofill"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
                onChange={(event) => setNewPassword(event.target.value)}
              />

              <label
                className="modal-label"
                htmlFor="patientConfirmPasswordInput"
              >
                Confirm Password
              </label>

              <input
                className="modal-date-input"
                id="patientConfirmPasswordInput"
                name="patientConfirmPasswordInputNoAutofill"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
                onChange={(event) => setConfirmPassword(event.target.value)}
              />

              {passwordError && <p className="modal-error">{passwordError}</p>}

              <button
                type="button"
                className="action-btn"
                onClick={handlePasswordUpdate}
                disabled={isSavingPassword}
              >
                {isSavingPassword ? "Updating..." : "Update Password"}
              </button>
            </section>

            <section className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowProfilePopup(false)}
              >
                Close
              </button>
            </section>
          </section>
        </section>
      )}

      {showSuccessPopup && (
        <section
          className="modal-overlay"
          onClick={() => setShowSuccessPopup(false)}
        >
          <section
            className="success-popup"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="success-popup-title">Success</h3>

            <p className="success-popup-text">{successMessage}</p>

            <button
              type="button"
              className="action-btn"
              onClick={() => setShowSuccessPopup(false)}
            >
              OK
            </button>
          </section>
        </section>
      )}
    </main>
  );
}

export default PatientDashboard;