import React, { useEffect, useState } from "react";
import { searchClinics } from "../pages/clinicService";

function QueuePage() {
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
  "Community health centre",
  "regional hospital",
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
    <div>
      <h1>Join Queue</h1>

      <div>
        <div>
          <label>Search Clinic Name: </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type clinic name"
          />
        </div>

        <div>
          <label>Province: </label>
          <select value={admin1} onChange={(e) => setAdmin1(e.target.value)}>
            <option value="">Select Province</option>
            {provinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Facility Type: </label>
          <select
            value={facilityType}
            onChange={(e) => setFacilityType(e.target.value)}
          >
            <option value="">Select Facility Type</option>
            {facilityTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <hr />

      {loading && <p>Searching clinics...</p>}
      {errorMessage && <p>{errorMessage}</p>}

<h2>Search Results</h2>

<div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #ccc", padding: "10px" }}>
  {clinics.length === 0 ? (
    <p>No clinics found.</p>
  ) : (
    clinics.map((clinic) => (
      <div key={clinic.id}>
        <p><strong>Name:</strong> {clinic.facility_name}</p>
        <p><strong>Province:</strong> {clinic.admin1}</p>
        <p><strong>Type:</strong> {clinic.facility_type}</p>
        <button onClick={() => handleSelectClinic(clinic)}>
          Select Clinic
        </button>
        <hr />
      </div>
    ))
  )}
</div>

      {selectedClinic && (
        <div>
          <h2>Selected Clinic</h2>
          <p><strong>Name:</strong> {selectedClinic.facility_name}</p>
          <p><strong>Province:</strong> {selectedClinic.admin1}</p>
          <p><strong>Type:</strong> {selectedClinic.facility_type}</p>

          {!joined ? (
            <button onClick={handleJoinQueue}>Join Queue</button>
          ) : (
            <div>
              <p>Joined queue at {selectedClinic.facility_name}</p>
              <p>Queue Number: 7</p>
              <p>Status: Waiting</p>
              <p>Estimated Wait: 45 mins</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QueuePage;