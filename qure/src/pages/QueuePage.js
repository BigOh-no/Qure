import React, { useEffect, useState } from "react";
import { searchClinics } from "../pages/clinicService";
import { useNavigate } from "react-router-dom";
import "../styles/Queue.css";

function QueuePage() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [admin1, setAdmin1] = useState("");
  const [facilityType, setFacilityType] = useState("");

  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);

  const [joined, setJoined] = useState(false);
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

  const handleSelectClinic = (clinic) => {
    setSelectedClinic(clinic);
    setJoined(false);
  };

  const handleJoinQueue = () => {
    if (!selectedClinic) {
      alert("Please select a clinic first.");
      return;
    }

    setJoined(true);
  };

  return (
    <main className="queue-page">
      <header className="queue-header">

  
      <section className="header-top">
      <h1 className="queue-title">Join Queue</h1>

        <button
          className="back-btn"
          onClick={() => navigate("/patient")}
        >
          ← Back
          </button>
        </section>

 
        <p className="queue-subtitle">
            Search for a clinic, select one, and join the queue.
        </p>

      </header>

      <section className="search-section" aria-labelledby="search-heading">
        <h2 id="search-heading" className="section-title">
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

        <section className="results-list" aria-label="Clinic search results">
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

            {!joined ? (
              <button
                className="primary-btn join-btn"
                type="button"
                onClick={handleJoinQueue}
              >
                Join Queue
              </button>
            ) : (
              <section className="queue-status" aria-label="Queue status">
                <p>
                  <strong>Clinic:</strong> {selectedClinic.facility_name}
                </p>
                <p>
                  <strong>Queue Number:</strong> 7
                </p>
                <p>
                  <strong>Status:</strong> Waiting
                </p>
                <p>
                  <strong>Estimated Wait:</strong> 45 mins
                </p>
              </section>
            )}
          </article>
        </section>
      )}
    </main>
  );
}

export default QueuePage;