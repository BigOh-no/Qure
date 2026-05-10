import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchClinics } from "../pages/clinicService";
import ClinicMap from "../pages/ClinicMap.js";
import {
  QUEUE_OPEN_TIME,
  QUEUE_CLOSE_TIME,
  AVERAGE_CONSULTATION_MINUTES,
  calculateEstimatedWait,
  getMyActiveQueueStatusForToday,
  getMyQueueEntryForClinic,
  getTodayQueueForClinic,
  isQueueOpenNow,
  joinQueue,
  leaveQueue,
} from "../pages/queueService";
import "../styles/Appointment.css";
import "../styles/Queue.css";

function QueuePage() {
  const navigate = useNavigate();
  const queueSectionRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [admin1, setAdmin1] = useState("");
  const [facilityType, setFacilityType] = useState("");

  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);

  const [queueEntries, setQueueEntries] = useState([]);
  const [myQueueEntry, setMyQueueEntry] = useState(null);
  const [myActiveQueueStatus, setMyActiveQueueStatus] = useState(null);

  const [loadingClinics, setLoadingClinics] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");

  const [showQueueBlockedPopup, setShowQueueBlockedPopup] = useState(false);
  const [showQueueJoinedPopup, setShowQueueJoinedPopup] = useState(false);

  const queueOpen = isQueueOpenNow();

  const hasSearchParams =
    searchTerm.trim() !== "" || admin1 !== "" || facilityType !== "";

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

  async function refreshMyActiveQueueStatus() {
    const activeStatus = await getMyActiveQueueStatusForToday();
    setMyActiveQueueStatus(activeStatus);
    return activeStatus;
  }

  useEffect(() => {
    const runSearch = async () => {
      setErrorMessage("");
      setMessage("");

      if (!searchTerm.trim() && !admin1 && !facilityType) {
        setClinics([]);
        setSelectedClinic(null);
        setQueueEntries([]);
        setMyQueueEntry(null);
        setMyActiveQueueStatus(null);
        return;
      }

      setLoadingClinics(true);

      try {
        await refreshMyActiveQueueStatus();

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
        setLoadingClinics(false);
      }
    };

    const delaySearch = setTimeout(() => {
      runSearch();
    }, 400);

    return () => clearTimeout(delaySearch);
  }, [searchTerm, admin1, facilityType]);

  async function loadQueue(clinic) {
    setSelectedClinic(clinic);
    setLoadingQueue(true);
    setMessage("");
    setErrorMessage("");

    try {
      const [queueData, myEntry, activeStatus] = await Promise.all([
        getTodayQueueForClinic(clinic.id),
        getMyQueueEntryForClinic(clinic.id),
        getMyActiveQueueStatusForToday(),
      ]);

      setQueueEntries(queueData);
      setMyQueueEntry(myEntry);
      setMyActiveQueueStatus(activeStatus);

      setTimeout(() => {
  queueSectionRef.current?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}, 4000);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Failed to load queue.");
    } finally {
      setLoadingQueue(false);
    }
  }

  async function handleJoinQueue() {
    if (!selectedClinic) return;

    setActionLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const activeStatus = await refreshMyActiveQueueStatus();

      if (activeStatus && activeStatus.entry.clinic_id !== selectedClinic.id) {
        setShowQueueBlockedPopup(true);
        return;
      }

      await joinQueue(selectedClinic.id);
      await loadQueue(selectedClinic);
      setShowQueueJoinedPopup(true);
    } catch (error) {
      console.error(error);

      if (error.message === "ALREADY_IN_QUEUE") {
        const activeStatus = await refreshMyActiveQueueStatus();

        if (activeStatus) {
          setShowQueueBlockedPopup(true);
        }
      } else {
        setMessage(error.message || "Failed to join queue.");
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLeaveQueue() {
    if (!myQueueEntry) return;

    setActionLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      await leaveQueue(myQueueEntry.id);
      await loadQueue(selectedClinic);
      await refreshMyActiveQueueStatus();
      setMessage("You have left the queue.");
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Failed to leave queue.");
    } finally {
      setActionLoading(false);
    }
  }

  function handleQueueJoinedPopupClose() {
    setShowQueueJoinedPopup(false);
    navigate("/patient");
  }

  const myPosition = myQueueEntry
    ? queueEntries.findIndex((entry) => entry.id === myQueueEntry.id) + 1
    : null;

  const previewPosition = queueEntries.length + 1;
  const previewWaitTime = calculateEstimatedWait(previewPosition);
  const myWaitTime = calculateEstimatedWait(myPosition);

  const blockedClinicName =
    myActiveQueueStatus?.clinic?.facility_name || "another clinic";

  const blockedQueuePosition = myActiveQueueStatus?.position || "unknown";

  const blockedEstimatedWait = myActiveQueueStatus?.estimatedWait ?? 0;

  return (
    <main className="book-appointment-page">
      <header className="booking-header">
        <section className="header-top">
          <h1 className="booking-title">Clinic Queue</h1>

          <button
            className="back-btn"
            type="button"
            onClick={() => navigate("/patient")}
          >
            ← Back
          </button>
        </section>

        <p className="booking-subtitle">
          Search for a clinic, view the current queue, and join the queue for
          today.
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

      {message && <p className="queue-message">{message}</p>}

      {hasSearchParams && (
        <section className="results-section" aria-labelledby="results-heading">
          <h2 id="results-heading" className="section-title">
            Search Results
          </h2>

          {loadingClinics && (
            <p className="status-message">Searching clinics...</p>
          )}

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
                        <strong>Province:</strong> {clinic.admin1 || "N/A"}
                      </p>

                      <p>
                        <strong>Type:</strong>{" "}
                        {clinic.facility_type || "N/A"}
                      </p>

                      <button
                        className="primary-btn"
                        type="button"
                        onClick={() => loadQueue(clinic)}
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
                  <ClinicMap clinics={clinics} selectedClinic={selectedClinic} />
                )}
              </section>
            </section>
          </section>
        </section>
      )}

      {selectedClinic && (
        <section
          className="selected-queue-section"
          ref={queueSectionRef}
          aria-labelledby="selected-queue-heading"
        >
          <h2 id="selected-queue-heading" className="section-title">
            {selectedClinic.facility_name} Queue
          </h2>

          <section className="queue-info-card">
            <p>
              <strong>Queue hours:</strong> {QUEUE_OPEN_TIME} -{" "}
              {QUEUE_CLOSE_TIME}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {queueOpen ? "Open for joining" : "Closed for joining"}
            </p>

            <p>
              <strong>Average consultation time:</strong>{" "}
              {AVERAGE_CONSULTATION_MINUTES} minutes
            </p>

            <p>
              <strong>Current queue length:</strong> {queueEntries.length}
            </p>
          </section>

          {loadingQueue ? (
            <p>Loading queue...</p>
          ) : (
            <>
              <section className="visual-queue">
                {queueEntries.length === 0 && !myQueueEntry ? (
                  <p className="empty-queue-message">
                    No patients are currently waiting. You would be first.
                  </p>
                ) : (
                  queueEntries.map((entry, index) => {
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

                {!myQueueEntry && (
                  <article className="queue-person-card queue-person-preview">
                    <section className="queue-position-number">
                      {previewPosition}
                    </section>

                    <section>
                      <p className="queue-person-label">You would join here</p>
                      <p className="queue-person-status">Preview</p>
                    </section>
                  </article>
                )}
              </section>

              {!myQueueEntry ? (
                <section className="queue-action-card">
                  <p>
                    <strong>Your position would be:</strong> {previewPosition}
                  </p>

                  <p>
                    <strong>Estimated wait time:</strong> {previewWaitTime}{" "}
                    minutes
                  </p>

                  <button
                    className="queue-button"
                    type="button"
                    onClick={handleJoinQueue}
                    disabled={!queueOpen || actionLoading}
                  >
                    {actionLoading ? "Joining..." : "Join Queue"}
                  </button>

                  {!queueOpen && (
                    <p className="queue-warning">
                      The queue is closed. Queue joining is only available from
                      08:00 to 17:00.
                    </p>
                  )}
                </section>
              ) : (
                <section className="queue-action-card">
                  <p>
                    <strong>Your current position:</strong> {myPosition}
                  </p>

                  <p>
                    <strong>Your estimated wait time:</strong> {myWaitTime}{" "}
                    minutes
                  </p>

                  <p>
                    <strong>Your status:</strong> {myQueueEntry.status}
                  </p>

                  <button
                    className="queue-button queue-danger-button"
                    type="button"
                    onClick={handleLeaveQueue}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Leaving..." : "Leave Queue"}
                  </button>
                </section>
              )}
            </>
          )}
        </section>
      )}

      {showQueueBlockedPopup && (
        <section className="queue-popup-overlay">
          <article className="queue-popup-box">
            <h2 className="queue-popup-title">Already in a Queue</h2>

            <p className="queue-popup-text">
              You are currently in the queue at:
            </p>

            <p className="queue-popup-clinic-name">{blockedClinicName}</p>

            <section className="queue-popup-details">
              <p>
                <strong>Your current position:</strong> {blockedQueuePosition}
              </p>

              <p>
                <strong>Estimated wait time:</strong> {blockedEstimatedWait}{" "}
                minutes
              </p>
            </section>

            <p className="queue-popup-text">
              You can only be in one clinic queue at a time. Please leave your
              current queue before joining another one.
            </p>

            <button
              className="queue-button queue-popup-button"
              type="button"
              onClick={() => setShowQueueBlockedPopup(false)}
            >
              Okay
            </button>
          </article>
        </section>
      )}

      {showQueueJoinedPopup && (
        <section className="queue-popup-overlay">
          <article className="queue-popup-box">
            <h2 className="queue-popup-title">Queue Joined Successfully</h2>

            <p className="queue-popup-text">
              You have successfully joined the queue at:
            </p>

            <p className="queue-popup-clinic-name">
              {selectedClinic?.facility_name || "this clinic"}
            </p>

            <p className="queue-popup-text">
              You can now view your queue position and estimated wait time from
              your dashboard.
            </p>

            <button
              className="queue-button queue-popup-button"
              type="button"
              onClick={handleQueueJoinedPopupClose}
            >
              Go to Dashboard
            </button>
          </article>
        </section>
      )}
    </main>
  );
}

export default QueuePage;