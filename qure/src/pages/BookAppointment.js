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
  const [time, setTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
    const loadBookedSlots = async () => {
      if (!selectedClinic || !date) {
        setBookedSlots([]);
        return;
      }

      try {
        const slots = await getBookedSlots(selectedClinic.id, date);
        setBookedSlots(slots);
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to load appointment slots.");
      }
    };

    loadBookedSlots();
  }, [selectedClinic, date]);

  const handleSelectClinic = (clinic) => {
    setSelectedClinic(clinic);
    setDate("");
    setTime("");
    setBookedSlots([]);
    setErrorMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedClinic) {
      alert("Please select a clinic first.");
      return;
    }

    if (!date || !time) {
      alert("Please select a date and time.");
      return;
    }

    try {
      setLoading(true);

      await createAppointment({
        clinicId: selectedClinic.id,
        appointmentDate: date,
        appointmentTime: time,
      });

      alert(
        `Appointment booked at ${selectedClinic.facility_name} for ${date} at ${time}`
      );

      navigate("/patient");
    } catch (error) {
      console.error(error);

      if (error.code === "23505") {
        alert("That slot has already been booked. Please choose another one.");
      } else {
        alert(error.message || "Failed to book appointment.");
      }
    } finally {
      setLoading(false);
    }
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

            <form className="booking-form" onSubmit={handleSubmit}>
              <section className="form-field">
                <label htmlFor="appointment-date">Date</label>
                <input
                  id="appointment-date"
                  type="date"
                  min={today}
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value);
                    setTime("");
                  }}
                />
              </section>

              {date && (
                <section className="form-field">
                  <label>Available Time Slots</label>
                  <section className="slot-grid">
                    {generateHourlySlots().map((slot) => {
                      const isBooked = bookedSlots.includes(slot);
                      const isSelected = time === slot;

                      return (
                        <button
                          key={slot}
                          type="button"
                          className={`slot-btn ${isSelected ? "selected" : ""}`}
                          disabled={isBooked}
                          onClick={() => setTime(slot)}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </section>
                </section>
              )}

              <button className="primary-btn confirm-btn" type="submit">
                Confirm Booking
              </button>
            </form>
          </article>
        </section>
      )}
    </main>
  );
}

export default BookAppointment;