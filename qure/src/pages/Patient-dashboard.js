import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseClient } from "../lib/supabaseClient";
import {
  getPatientAppointments,
  cancelAppointment,
  rescheduleAppointment,
  getBookedSlots,
  generateHourlySlots,
} from "./appointmentService";
import "../styles/Patient.css";
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

  useEffect(() => {
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

  const handleCancelAppointment = async (appointmentId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancellingId(appointmentId);
      await cancelAppointment(appointmentId);

      setAppointments((currentAppointments) =>
        currentAppointments.filter((appt) => appt.id !== appointmentId)
      );
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to cancel appointment.");
    } finally {
      setCancellingId(null);
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

      const bookedSlots = await getBookedSlots(appointment.clinic_id, newDate);
      const currentTime = appointment.appointment_time?.slice(0, 5) || "";
      const allSlots = generateHourlySlots();
      const now = new Date();

      const statusMap = {};

      allSlots.forEach((slot) => {
        const slotDateTime = new Date(`${newDate}T${slot}`);
        const isCurrentAppointmentSlot =
          newDate === appointment.appointment_date && slot === currentTime;

        if (slotDateTime < now) {
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

    if (status === "booked" || status === "past") {
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

    if (slotStatus === "booked" || slotStatus === "past") {
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
            const aDate = new Date(`${a.appointment_date}T${a.appointment_time}`);
            const bDate = new Date(`${b.appointment_date}T${b.appointment_time}`);
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
                    onClick={() => handleCancelAppointment(appt.id)}
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

      {showRescheduleModal && (
        <div className="modal-overlay" onClick={closeRescheduleModal}>
          <div
            className="reschedule-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="modal-title">Reschedule Appointment</h3>

            <p className="modal-clinic-name">
              {selectedAppointment?.clinics?.facility_name || "Clinic"}
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
              onChange={(e) => setRescheduleDate(e.target.value)}
            />

            <div className="modal-slots-section">
              <p className="modal-label">Choose a time slot</p>

              {loadingSlots ? (
                <p className="modal-info">Loading slots...</p>
              ) : availableSlots.length > 0 ? (
                <div className="slot-grid">
                  {availableSlots.map((slot) => {
                    const status = slotStatusMap[slot];
                    const isSelected = selectedSlot === slot;
                    const isDisabled = status === "booked" || status === "past";

                    return (
                      <button
                        key={slot}
                        type="button"
                        className={`slot-btn ${
                          status === "booked" ? "slot-btn-booked" : ""
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
                </div>
              ) : (
                <p className="modal-info">No slots found for this date.</p>
              )}
            </div>

            {rescheduleError && (
              <p className="modal-error">{rescheduleError}</p>
            )}

            <div className="modal-actions">
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
                  slotStatusMap[selectedSlot] === "past"
                }
              >
                {reschedulingId === selectedAppointment?.id
                  ? "Saving..."
                  : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessPopup && (
        <div
          className="modal-overlay"
          onClick={() => setShowSuccessPopup(false)}
        >
          <div
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
          </div>
        </div>
      )}
    </main>
  );
}

export default PatientDashboard;