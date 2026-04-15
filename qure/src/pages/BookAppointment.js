import React, { useEffect, useState } from "react";
import { searchClinics } from "../pages/clinicService";
import ClinicMap from "../pages/ClinicMap.js";

function BookAppointment() {
  const [searchTerm, setSearchTerm] = useState("");
  const [admin1, setAdmin1] = useState("");
  const [facilityType, setFacilityType] = useState("");

  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

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

      // Do not load everything if no filter is chosen
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedClinic) {
      alert("Please select a clinic first.");
      return;
    }

    if (!date || !time) {
      alert("Please select a date and time.");
      return;
    }

    console.log("Booking details:", {
      clinic: selectedClinic,
      date,
      time,
    });

    alert(`Appointment booked at ${selectedClinic.facility_name}`);
  };

  return (
    <div>
      <h1>Book Appointment</h1>

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
{clinics.length > 0 && (
  <ClinicMap 
    clinics={clinics} 
    selectedClinic={selectedClinic} 
  />
)}

      {selectedClinic && (
        <div>
          <h2>Selected Clinic</h2>
          <p><strong>Name:</strong> {selectedClinic.facility_name}</p>
          <p><strong>Province:</strong> {selectedClinic.admin1}</p>
          <p><strong>Type:</strong> {selectedClinic.facility_type}</p>

          <form onSubmit={handleSubmit}>
            <div>
              <label>Date: </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div>
              <label>Time: </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>

            <button type="submit">Confirm Booking</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default BookAppointment;