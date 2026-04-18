import React, { useEffect, useState } from "react";
import { searchClinics } from "../pages/clinicService";
import { getBookedSlots, createAppointment } from "../pages/appointmentService";
import { generateHourlySlots } from "../pages/slotUtils";
import ClinicMap from "../pages/ClinicMap.js";
import "../styles/Appointment.css";
import { useNavigate } from "react-router-dom";

function BookAppointment() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [admin1, setAdmin1] = useState("");
  const [facilityType, setFacilityType] = useState("");

  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);

  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotStatusMap, setSlotStatusMap] = useState({});

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const provinces = [
    "Eastern Cape",
    "Free State",
    "Gauteng",
    "KwaZulu-Natal",
    "Limpopo",
    "Mpumalanga",
    "North West",
    "Northern Cape",
    "Western Cape",
  ];

  const facilityTypes = [
    "District Hospital",
    "Clinic",
    "Satellite Clinic",
    "Community Health Centre",
    "Regional Hospital",
    "Provincial Tertiary Hospital",
    "National Central Hospital",
  ];

  useEffect(() => {
    const runSearch = async () => {
      setErrorMessage("");

      if (!searchTerm.trim() && !admin1 && !facilityType) {
        setClinics([]);
        return;
      }

      setLoading(true);

      try {
        const results = await searchClinics({
          searchTerm,
          admin1,
          facilityType,
        });

        setClinics(results);
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to search clinics.");
      } finally {
        setLoading(false);
      }
    };

    runSearch();
  }, [searchTerm, admin1, facilityType]);

  useEffect(() => {
    const loadAvailableSlots = async () => {
      if (!selectedClinic || !date) {
        setAvailableSlots([]);
        setSlotStatusMap({});
        setSelectedSlot("");
        return;
      }

      try {
        setLoadingSlots(true);
        setErrorMessage("");
        setAvailableSlots([]);
        setSlotStatusMap({});
        setSelectedSlot("");

        const today = new Date().toISOString().split("T")[0];

        if (date < today) {
          setErrorMessage("Please choose today or a future date.");
          return;
        }

        const bookedSlots = await getBookedSlots(selectedClinic.id, date);
        const allSlots = generateHourlySlots();
        const now = new Date();

        const statusMap = {};

        allSlots.forEach((slot) => {
          const slotDateTime = new Date(`${date}T${slot}`);

          if (slotDateTime < now) {
            statusMap[slot] = "past";
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
        setErrorMessage("Failed to load appointment slots.");
      } finally {
        setLoadingSlots(false);
      }
    };

    loadAvailableSlots();
  }, [selectedClinic, date]);

  const handleSelectClinic = (clinic) => {
    setSelectedClinic(clinic);
    setDate("");
    setSelectedSlot("");
    setAvailableSlots([]);
    setSlotStatusMap({});
    setErrorMessage("");
  };

  const handleSlotSelect = (slot) => {
    const status = slotStatusMap[slot];

    if (status === "booked" || status === "past") {
      return;
    }

    setSelectedSlot(slot);
    setErrorMessage("");
  };

  const handleConfirmBooking = async (event) => {
    event.preventDefault();

    if (!selectedClinic) {
      setErrorMessage("Please select a clinic first.");
      return;
    }

    if (!date) {
      setErrorMessage("Please select a date.");
      return;
    }

    if (!selectedSlot) {
      setErrorMessage("Please choose a time slot.");
      return;
    }

    const slotStatus = slotStatusMap[selectedSlot];

    if (slotStatus === "booked" || slotStatus === "past") {
      setErrorMessage("Please choose a valid available time slot.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      await createAppointment({
        clinicId: selectedClinic.id,
        appointmentDate: date,
        appointmentTime: selectedSlot,
      });

      setSuccessMessage(
        `Appointment booked successfully for ${date} at ${selectedSlot}.`
      );
      setShowSuccessPopup(true);
    } catch (error) {
      console.error(error);

      if (error.code === "23505") {
        setErrorMessage(
          "That slot has already been booked. Please choose another one."
        );
      } else {
        setErrorMessage(error.message || "Failed to book appointment.");
      }
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
    navigate("/patient");
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <main className="book-appointment-page">
      <header className="booking-header">
        <h1 className="booking-title">Book Appointment</h1>
        <p className="booking-subtitle">
          Search for a clinic, choose a date and time, and confirm your booking.
        </p>
      </header>

      <section
        className="search-section"
        aria-labelledby="search-filters-heading"
      >
        <h2 id="search-filters-heading" className="section-title">
          Find a Clinic
        </h2>

        <form
          className="search-form"
          onSubmit={(event) => event.preventDefault()}
        >
          <section className="form-field">
            <label htmlFor="clinic-search">Search Clinic Name</label>
            <input
              id="clinic-search"
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Type clinic name"
            />
          </section>

          <section className="form-field">
            <label htmlFor="province-select">Province</label>
            <select
              id="province-select"
              value={admin1}
              onChange={(event) => setAdmin1(event.target.value)}
            >
              <option value="">Select Province</option>
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </section>

          <section className="form-field">
            <label htmlFor="facility-type-select">Facility Type</label>
            <select
              id="facility-type-select"
              value={facilityType}
              onChange={(event) => setFacilityType(event.target.value)}
            >
              <option value="">Select Facility Type</option>
              {facilityTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </section>
        </form>
      </section>

      <hr className="section-divider" />

      <section className="results-section" aria-labelledby="results-heading">
        <h2 id="results-heading" className="section-title">
          Search Results
        </h2>

        {loading && <p className="status-message">Searching clinics...</p>}
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <section className="results-layout">
          <section
            className="results-list-panel"
            aria-label="Clinic search results"
          >
            <section className="results-list">
              {clinics.length === 0 ? (
                <p className="empty-state">No clinics found.</p>
              ) : (
                clinics.map((clinic) => (
                  <article className="clinic-card" key={clinic.id}>
                    <p>
                      <strong>Name:</strong> {clinic.facility_name}
                    </p>
                    <p>
                      <strong>Province:</strong> {clinic.admin1}
                    </p>
                    <p>
                      <strong>Type:</strong> {clinic.facility_type}
                    </p>

                    <button
                      className="primary-btn"
                      type="button"
                      onClick={() => handleSelectClinic(clinic)}
                    >
                      Select Clinic
                    </button>
                  </article>
                ))
              )}
            </section>
          </section>

          <section className="map-section" aria-labelledby="map-heading">
            <h3 id="map-heading" className="subsection-title">
              Clinic Map
            </h3>

            <section className="map-wrapper">
              {clinics.length === 0 ? (
                <p className="empty-state">
                  Map will appear once clinics are found.
                </p>
              ) : (
                <ClinicMap
                  clinics={clinics}
                  selectedClinic={selectedClinic}
                />
              )}
            </section>
          </section>
        </section>
      </section>

      {selectedClinic && (
        <section
          className="selected-clinic-section"
          aria-labelledby="selected-clinic-heading"
        >
          <h2 id="selected-clinic-heading" className="section-title">
            Selected Clinic
          </h2>

          <article className="selected-clinic-card">
            <p>
              <strong>Name:</strong> {selectedClinic.facility_name}
            </p>
            <p>
              <strong>Province:</strong> {selectedClinic.admin1}
            </p>
            <p>
              <strong>Type:</strong> {selectedClinic.facility_type}
            </p>

            <form className="booking-form" onSubmit={handleConfirmBooking}>
              <section className="form-field">
                <label htmlFor="appointment-date">Date</label>
                <input
                  id="appointment-date"
                  type="date"
                  min={today}
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value);
                    setSelectedSlot("");
                    setErrorMessage("");
                  }}
                />
              </section>

              {date && (
                <section className="form-field">
                  <label>Choose a time slot</label>

                  {loadingSlots ? (
                    <p className="modal-info">Loading slots...</p>
                  ) : availableSlots.length > 0 ? (
                    <div className="slot-grid">
                      {availableSlots.map((slot) => {
                        const status = slotStatusMap[slot];
                        const isSelected = selectedSlot === slot;
                        const isDisabled =
                          status === "booked" || status === "past";

                        return (
                          <button
                            key={slot}
                            type="button"
                            className={`slot-btn ${
                              status === "booked" ? "slot-btn-booked" : ""
                            } ${status === "past" ? "slot-btn-past" : ""} ${
                              isSelected ? "slot-btn-active" : ""
                            }`}
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
                </section>
              )}

              <button
                className="action-btn"
                type="submit"
                disabled={
                  loading ||
                  !selectedSlot ||
                  slotStatusMap[selectedSlot] === "booked" ||
                  slotStatusMap[selectedSlot] === "past"
                }
              >
                {loading ? "Saving..." : "Confirm"}
              </button>
            </form>
          </article>
        </section>
      )}

      {showSuccessPopup && (
        <div className="modal-overlay" onClick={closeSuccessPopup}>
          <div
            className="success-popup"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="success-popup-title">Success</h3>
            <p className="success-popup-text">{successMessage}</p>
            <button
              type="button"
              className="action-btn"
              onClick={closeSuccessPopup}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default BookAppointment;