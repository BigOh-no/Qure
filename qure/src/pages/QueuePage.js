import { useEffect, useRef, useState } from "react";
import { supabaseClient } from "../lib/supabaseClient";
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
import "../styles/Queue.css";

function QueuePage() {
  const queueSectionRef = useRef(null);

  const [clinicSearch, setClinicSearch] = useState("");
  const [province, setProvince] = useState("");
  const [facilityType, setFacilityType] = useState("");

  const [clinicResults, setClinicResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedClinic, setSelectedClinic] = useState(null);
  const [queueEntries, setQueueEntries] = useState([]);
  const [myQueueEntry, setMyQueueEntry] = useState(null);
  const [myActiveQueueStatus, setMyActiveQueueStatus] = useState(null);

  const [loadingClinics, setLoadingClinics] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [showQueueBlockedPopup, setShowQueueBlockedPopup] = useState(false);

  const queueOpen = isQueueOpenNow();

  const provinceOptions = [
    "Eastern Cape",
    "Free State",
    "Gauteng",
    "KwaZulu-Natal",
    "Limpopo",
    "Mpumalanga",
    "Northern Cape",
    "North West",
    "Western Cape",
  ];

  const facilityTypeOptions = [
    "District Hospital",
    "Clinic",
    "Satellite Clinic",
    "Community health centre",
    "Regional Hospital",
    "Provincial Tertiary Hospital",
    "National Central Hospital",
  ];

  async function refreshMyActiveQueueStatus() {
    const activeStatus = await getMyActiveQueueStatusForToday();
    setMyActiveQueueStatus(activeStatus);
    return activeStatus;
  }

  async function searchClinics() {
    const hasSearchParams =
      clinicSearch.trim() !== "" || province !== "" || facilityType !== "";

    setHasSearched(hasSearchParams);
    setSelectedClinic(null);
    setQueueEntries([]);
    setMyQueueEntry(null);
    setMessage("");

    if (!hasSearchParams) {
      setClinicResults([]);
      setMyActiveQueueStatus(null);
      return;
    }

    setLoadingClinics(true);

    try {
      await refreshMyActiveQueueStatus();

      let query = supabaseClient.from("clinics").select("*").limit(50);

      if (clinicSearch.trim() !== "") {
        query = query.ilike("facility_name", `${clinicSearch.trim()}%`);
      }

      if (province !== "") {
        query = query.eq("province", province);
      }

      if (facilityType !== "") {
        query = query.eq("facility_type", facilityType);
      }

      const { data, error } = await query;

      if (error) throw error;

      setClinicResults(data || []);
    } catch (error) {
      setMessage(error.message || "Failed to search clinics.");
    } finally {
      setLoadingClinics(false);
    }
  }

  async function loadQueue(clinic) {
    setSelectedClinic(clinic);
    setLoadingQueue(true);
    setMessage("");

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
      }, 100);
    } catch (error) {
      setMessage(error.message || "Failed to load queue.");
    } finally {
      setLoadingQueue(false);
    }
  }

  async function handleJoinQueue() {
    if (!selectedClinic) return;

    setActionLoading(true);
    setMessage("");

    try {
      const activeStatus = await refreshMyActiveQueueStatus();

      if (activeStatus && activeStatus.entry.clinic_id !== selectedClinic.id) {
        setShowQueueBlockedPopup(true);
        return;
      }

      await joinQueue(selectedClinic.id);
      await loadQueue(selectedClinic);
      setMessage("You have joined the queue.");
    } catch (error) {
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

    try {
      await leaveQueue(myQueueEntry.id);
      await loadQueue(selectedClinic);
      await refreshMyActiveQueueStatus();
      setMessage("You have left the queue.");
    } catch (error) {
      setMessage(error.message || "Failed to leave queue.");
    } finally {
      setActionLoading(false);
    }
  }

  useEffect(() => {
    const hasSearchParams =
      clinicSearch.trim() !== "" || province !== "" || facilityType !== "";

    if (!hasSearchParams) {
      setHasSearched(false);
      setClinicResults([]);
      setSelectedClinic(null);
      setQueueEntries([]);
      setMyQueueEntry(null);
      setMyActiveQueueStatus(null);
      setMessage("");
      return;
    }

    const delaySearch = setTimeout(() => {
      searchClinics();
    }, 400);

    return () => clearTimeout(delaySearch);
  }, [clinicSearch, province, facilityType]);

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
    <main className="queue-page">
      <header className="queue-header">
        <h1 className="queue-title">Clinic Queue</h1>
        <p className="queue-subtitle">
          Search for a clinic, view the current queue, and join the queue for today.
        </p>
      </header>

      <section className="queue-search-section">
        <h2 className="section-title">Find a Clinic</h2>

        <div className="queue-search-grid">
          <input
            className="queue-input"
            type="text"
            placeholder="Search clinic by name"
            value={clinicSearch}
            onChange={(event) => setClinicSearch(event.target.value)}
          />

          <select
            className="queue-input"
            value={province}
            onChange={(event) => setProvince(event.target.value)}
          >
            <option value="">All provinces</option>
            {provinceOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            className="queue-input"
            value={facilityType}
            onChange={(event) => setFacilityType(event.target.value)}
          >
            <option value="">All facility types</option>
            {facilityTypeOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </section>

      {message && <p className="queue-message">{message}</p>}

      {hasSearched && (
        <section className="queue-results-section">
          <h2 className="section-title">Search Results</h2>

          {loadingClinics ? (
            <p>Loading clinics...</p>
          ) : clinicResults.length === 0 ? (
            <p>No clinics found.</p>
          ) : (
            <div className="queue-results-list">
              {clinicResults.map((clinic) => (
                <article
                  key={clinic.id}
                  className={`clinic-result-card ${
                    selectedClinic?.id === clinic.id ? "clinic-result-card-selected" : ""
                  }`}
                  onClick={() => loadQueue(clinic)}
                >
                  <h3>{clinic.facility_name}</h3>
                  <p>
                    <strong>Province:</strong> {clinic.province || "N/A"}
                  </p>
                  <p>
                    <strong>Facility Type:</strong> {clinic.facility_type || "N/A"}
                  </p>
                  <p>
                    <strong>District:</strong> {clinic.district || "N/A"}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {selectedClinic && (
        <section className="selected-queue-section" ref={queueSectionRef}>
          <h2 className="section-title">{selectedClinic.facility_name} Queue</h2>

          <div className="queue-info-card">
            <p>
              <strong>Queue hours:</strong> {QUEUE_OPEN_TIME} - {QUEUE_CLOSE_TIME}
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
          </div>

          {loadingQueue ? (
            <p>Loading queue...</p>
          ) : (
            <>
              <div className="visual-queue">
                {queueEntries.length === 0 && !myQueueEntry ? (
                  <p className="empty-queue-message">
                    No patients are currently waiting. You would be first.
                  </p>
                ) : (
                  queueEntries.map((entry, index) => {
                    const isMe = myQueueEntry?.id === entry.id;

                    return (
                      <div
                        key={entry.id}
                        className={`queue-person-card ${isMe ? "queue-person-you" : ""}`}
                      >
                        <div className="queue-position-number">{index + 1}</div>
                        <div>
                          <p className="queue-person-label">
                            {isMe ? "You" : `Patient ${index + 1}`}
                          </p>
                          <p className="queue-person-status">{entry.status}</p>
                        </div>
                      </div>
                    );
                  })
                )}

                {!myQueueEntry && (
                  <div className="queue-person-card queue-person-preview">
                    <div className="queue-position-number">{previewPosition}</div>
                    <div>
                      <p className="queue-person-label">You would join here</p>
                      <p className="queue-person-status">Preview</p>
                    </div>
                  </div>
                )}
              </div>

              {!myQueueEntry ? (
                <div className="queue-action-card">
                  <p>
                    <strong>Your position would be:</strong> {previewPosition}
                  </p>
                  <p>
                    <strong>Estimated wait time:</strong> {previewWaitTime} minutes
                  </p>

                  <button
                    className="queue-button"
                    onClick={handleJoinQueue}
                    disabled={!queueOpen || actionLoading}
                  >
                    {actionLoading ? "Joining..." : "Join Queue"}
                  </button>

                  {!queueOpen && (
                    <p className="queue-warning">
                      The queue is closed. Queue joining is only available from 08:00 to
                      17:00.
                    </p>
                  )}
                </div>
              ) : (
                <div className="queue-action-card">
                  <p>
                    <strong>Your current position:</strong> {myPosition}
                  </p>
                  <p>
                    <strong>Your estimated wait time:</strong> {myWaitTime} minutes
                  </p>
                  <p>
                    <strong>Your status:</strong> {myQueueEntry.status}
                  </p>

                  <button
                    className="queue-button queue-danger-button"
                    onClick={handleLeaveQueue}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Leaving..." : "Leave Queue"}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {showQueueBlockedPopup && (
        <div className="queue-popup-overlay">
          <div className="queue-popup-box">
            <h2 className="queue-popup-title">Already in a Queue</h2>

            <p className="queue-popup-text">
              You are currently in the queue at:
            </p>

            <p className="queue-popup-clinic-name">{blockedClinicName}</p>

            <div className="queue-popup-details">
              <p>
                <strong>Your current position:</strong> {blockedQueuePosition}
              </p>
              <p>
                <strong>Estimated wait time:</strong> {blockedEstimatedWait} minutes
              </p>
            </div>

            <p className="queue-popup-text">
              You can only be in one clinic queue at a time. Please leave your current
              queue before joining another one.
            </p>

            <button
              className="queue-button queue-popup-button"
              onClick={() => setShowQueueBlockedPopup(false)}
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default QueuePage;