import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllPatientAppointments,
  cancelAppointment,
  rescheduleAppointment,
  getBookedSlots,
  generateHourlySlots,
  isSlotWithinClinicHours,
  formatClinicHours,
} from "./appointmentService";
import "../styles/ViewAppointments.css";

function AppointmentsPage() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentError, setAppointmentError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [sortDirection, setSortDirection] = useState("desc");

  const [cancellingId, setCancellingId] = useState(null);
  const [reschedulingId, setReschedulingId] = useState(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

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

  async function loadAppointments() {
    try {
      setLoadingAppointments(true);
      setAppointmentError("");

      const appointmentData = await getAllPatientAppointments();
      setAppointments(appointmentData);
    } catch (error) {
      console.error(error);
      setAppointmentError("Failed to load your appointments.");
    } finally {
      setLoadingAppointments(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  function getAppointmentDateTime(appointment) {
    return new Date(
      `${appointment.appointment_date}T${
        appointment.appointment_time || "00:00"
      }`
    );
  }

  function isUpcomingAppointment(appointment) {
    const appointmentDateTime = getAppointmentDateTime(appointment);
    const now = new Date();

    return (
      appointmentDateTime >= now &&
      appointment.status?.toLowerCase() === "booked"
    );
  }

  function getDisplayStatus(appointment) {
    const status = appointment.status?.toLowerCase();

    if (status === "cancelled" || status === "canceled") {
      return "Cancelled";
    }

    if (status === "completed" || status === "complete") {
      return "Completed";
    }

    if (isUpcomingAppointment(appointment)) {
      return "Upcoming";
    }

    if (status === "booked") {
      return "Past";
    }

    return appointment.status || "Unknown";
  }

  const filteredAndSortedAppointments = useMemo(() => {
    let filteredAppointments = [...appointments];

    if (statusFilter !== "all") {
      filteredAppointments = filteredAppointments.filter((appointment) => {
        const displayStatus = getDisplayStatus(appointment).toLowerCase();

        if (statusFilter === "upcoming") {
          return displayStatus === "upcoming";
        }

        if (statusFilter === "past") {
          return displayStatus === "past";
        }

        if (statusFilter === "completed") {
          return displayStatus === "completed";
        }

        if (statusFilter === "cancelled") {
          return displayStatus === "cancelled";
        }

        return true;
      });
    }

    filteredAppointments.sort((a, b) => {
      const firstDate = getAppointmentDateTime(a);
      const secondDate = getAppointmentDateTime(b);

      if (sortDirection === "asc") {
        return firstDate - secondDate;
      }

      return secondDate - firstDate;
    });

    return filteredAppointments;
  }, [appointments, statusFilter, sortDirection]);

  function openCancelModal(appointment) {
    setAppointmentToCancel(appointment);
    setShowCancelModal(true);
  }

  function closeCancelModal() {
    setAppointmentToCancel(null);
    setShowCancelModal(false);
  }

  async function handleCancelAppointment() {
    if (!appointmentToCancel) {
      return;
    }

    try {
      setCancellingId(appointmentToCancel.id);

      await cancelAppointment(appointmentToCancel.id);

      setAppointments((currentAppointments) =>
        currentAppointments.map((appointment) =>
          appointment.id === appointmentToCancel.id
            ? { ...appointment, status: "cancelled" }
            : appointment
        )
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
  }

  function openRescheduleModal(appointment) {
    setSelectedAppointment(appointment);
    setRescheduleDate(appointment.appointment_date);
    setSelectedSlot("");
    setAvailableSlots([]);
    setSlotStatusMap({});
    setRescheduleError("");
    setShowRescheduleModal(true);
  }

  function closeRescheduleModal() {
    setShowRescheduleModal(false);
    setSelectedAppointment(null);
    setRescheduleDate("");
    setAvailableSlots([]);
    setSlotStatusMap({});
    setSelectedSlot("");
    setLoadingSlots(false);
    setRescheduleError("");
  }

  async function loadAvailableSlots(appointment, newDate) {
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
  }

  useEffect(() => {
    if (showRescheduleModal && selectedAppointment && rescheduleDate) {
      loadAvailableSlots(selectedAppointment, rescheduleDate);
    }
  }, [showRescheduleModal, selectedAppointment, rescheduleDate]);

  function handleSlotSelect(slot) {
    const status = slotStatusMap[slot];

    if (status === "booked" || status === "past" || status === "closed") {
      return;
    }

    setSelectedSlot(slot);
    setRescheduleError("");
  }

  async function handleConfirmReschedule() {
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
        currentAppointments.map((appointment) =>
          appointment.id === selectedAppointment.id
            ? {
                ...appointment,
                appointment_date: rescheduleDate,
                appointment_time: selectedSlot,
                status: "booked",
              }
            : appointment
        )
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
  }

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
          View all your upcoming, past, cancelled, and completed appointments.
        </p>
      </header>

      <section
        className="appointments-section"
        aria-labelledby="appointments-heading"
      >
        <h2 id="appointments-heading" className="section-title">
          All Appointments
        </h2>

        <section
          className="appointment-filters"
          aria-label="Appointment filters"
        >
          <section className="filter-group">
            <label className="filter-label" htmlFor="status-filter">
              Filter by status
            </label>

            <select
              id="status-filter"
              className="filter-input"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All appointments</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </section>

          <section className="filter-group">
            <label className="filter-label" htmlFor="sort-direction">
              Sort by date
            </label>

            <select
              id="sort-direction"
              className="filter-input"
              value={sortDirection}
              onChange={(event) => setSortDirection(event.target.value)}
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </section>
        </section>

        {loadingAppointments && (
          <p className="empty-state">Loading appointments...</p>
        )}

        {appointmentError && <p className="empty-state">{appointmentError}</p>}

        {!loadingAppointments &&
        !appointmentError &&
        filteredAndSortedAppointments.length === 0 ? (
          <p className="empty-state">No appointments found.</p>
        ) : null}

        {!loadingAppointments &&
        !appointmentError &&
        filteredAndSortedAppointments.length > 0 ? (
          <section className="appointments-list" aria-label="Appointments list">
            {filteredAndSortedAppointments.map((appt) => {
              const canManageAppointment = isUpcomingAppointment(appt);
              const displayStatus = getDisplayStatus(appt);

              return (
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
                    <strong>Status:</strong> {displayStatus}
                  </p>

                  {canManageAppointment ? (
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
                  ) : (
                    <p className="appointment-readonly-note">
                      This appointment cannot be changed.
                    </p>
                  )}
                </article>
              );
            })}
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

export default AppointmentsPage;