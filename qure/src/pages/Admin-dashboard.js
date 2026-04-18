import React, { useEffect, useState } from "react";
import "../styles/Admin.css";
import { useNavigate } from "react-router-dom";
import logo from "../assets/images/TLogo.png";
import { createAdminInvite, logout } from "../lib/auth";
import { searchClinics } from "../pages/clinicService";

function AdminDashboard() {
  const navigate = useNavigate();

  const adminName = "Admin";

  const [showStaffPopup, setShowStaffPopup] = useState(false);
  const [showAdminPopup, setShowAdminPopup] = useState(false);
  const [showClinicPopup, setShowClinicPopup] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);

  const [staffClinicSearch, setStaffClinicSearch] = useState("");
  const [staffProvince, setStaffProvince] = useState("");
  const [staffFacilityType, setStaffFacilityType] = useState("");
  const [staffClinicResults, setStaffClinicResults] = useState([]);
  const [selectedStaffClinic, setSelectedStaffClinic] = useState(null);
  const [staffClinicLoading, setStaffClinicLoading] = useState(false);
  const [staffClinicError, setStaffClinicError] = useState("");

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

  const stats = [
    { title: "Total Staff", value: 18 },
    { title: "Total Clinics", value: 5 },
    { title: "Appointments Today", value: 24 },
    { title: "Patients Waiting", value: 11 },
  ];

  const recentActivity = [
    "Dr Smith added to Hillbrow Clinic",
    "New admin created",
    "Clinic hours updated",
  ];

  useEffect(() => {
    const runStaffClinicSearch = async () => {
      if (!showStaffPopup) return;

      setStaffClinicError("");

      if (!staffClinicSearch.trim() && !staffProvince && !staffFacilityType) {
        setStaffClinicResults([]);
        return;
      }

      setStaffClinicLoading(true);

      try {
        const results = await searchClinics({
          searchTerm: staffClinicSearch,
          admin1: staffProvince,
          facilityType: staffFacilityType,
        });

        setStaffClinicResults(results);
      } catch (error) {
        console.error(error);
        setStaffClinicError("Failed to search clinics.");
      } finally {
        setStaffClinicLoading(false);
      }
    };

    runStaffClinicSearch();
  }, [showStaffPopup, staffClinicSearch, staffProvince, staffFacilityType]);

  const resetStaffPopup = () => {
    setShowStaffPopup(false);
    setStaffClinicSearch("");
    setStaffProvince("");
    setStaffFacilityType("");
    setStaffClinicResults([]);
    setSelectedStaffClinic(null);
    setStaffClinicError("");
    setStaffClinicLoading(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error.message);
      navigate("/");
    }
  };

  const handleStaffSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    if (!selectedStaffClinic) {
      alert("Please select a clinic first.");
      return;
    }

    const staffData = {
      email: formData.get("staffEmail"),
      clinic: selectedStaffClinic.facility_name,
      clinicId: selectedStaffClinic.id,
    };

    console.log("Staff data:", staffData);
    event.target.reset();
    resetStaffPopup();
  };

  const handleAdminSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const email = formData.get("adminEmail")?.toString().trim().toLowerCase();

    setSuccessMessage("");
    setErrorMessage("");
    setIsSavingAdmin(true);

    try {
      await createAdminInvite(email);

      setSuccessMessage(
        `Tell ${email} to check their inbox to reset their password.`
      );

      event.target.reset();
      setShowAdminPopup(false);
    } catch (error) {
      console.error("Admin invite failed:", error);
      setErrorMessage(error.message || "Failed to add admin.");
    } finally {
      setIsSavingAdmin(false);
    }
  };

  const handleClinicSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    const clinicData = {
      clinicName: formData.get("clinicName"),
      location: formData.get("clinicLocation"),
      operatingHours: formData.get("clinicHours"),
      contactNumber: formData.get("clinicContact"),
    };

    console.log("Clinic data:", clinicData);
    event.target.reset();
    setShowClinicPopup(false);
  };

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <header className="sidebar-header">
          <img src={logo} alt="Qure logo" className="sidebar-logo" />
        </header>

        <nav className="sidebar-nav">
          <ul>
            <li><button type="button">Staff</button></li>
            <li><button type="button">Clinics</button></li>
            <li><button type="button">Analytics</button></li>
            <li><button type="button">Profile</button></li>
          </ul>
        </nav>

        <footer className="sidebar-footer">
          <button type="button" className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </footer>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome back, {adminName}</p>
        </header>

        {successMessage && (
          <p className="admin-success-message">{successMessage}</p>
        )}

        {errorMessage && (
          <p className="admin-error-message">{errorMessage}</p>
        )}

        <section className="stats-section">
          {stats.map((stat, index) => (
            <article key={index} className="stat-card">
              <h3>{stat.title}</h3>
              <p className="stat-value">{stat.value}</p>
            </article>
          ))}
        </section>

        <section className="dashboard-grid">
          <article className="dashboard-card">
            <header>
              <h2>Quick Actions</h2>
            </header>

            <ul className="action-list">
              <li>
                <button
                  type="button"
                  className="action-btn"
                  onClick={() => setShowStaffPopup(true)}
                >
                  Add Staff Member
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="action-btn"
                  onClick={() => setShowAdminPopup(true)}
                >
                  Add Admin
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="action-btn"
                  onClick={() => setShowClinicPopup(true)}
                >
                  Edit Clinic
                </button>
              </li>
            </ul>
          </article>

          <article className="dashboard-card">
            <header>
              <h2>Recent Activity</h2>
            </header>
            <ul className="activity-list">
              {recentActivity.map((activity, index) => (
                <li key={index}>{activity}</li>
              ))}
            </ul>
          </article>
        </section>

        {showStaffPopup && (
          <dialog className="popup-dialog popup-dialog-wide" open>
            <form className="popup-form" onSubmit={handleStaffSubmit}>
              <header className="popup-header">
                <h2>Add Staff Member</h2>
              </header>

              <label className="popup-label" htmlFor="staffEmail">
                Email
              </label>
              <input
                className="popup-input"
                id="staffEmail"
                name="staffEmail"
                type="email"
                required
              />

              <section className="clinic-search-section">
                <h3 className="popup-subheading">Assign Clinic</h3>

                <section className="clinic-search-grid">
                  <section className="popup-field-group">
                    <label className="popup-label" htmlFor="staffClinicSearch">
                      Search Clinic Name
                    </label>
                    <input
                      className="popup-input"
                      id="staffClinicSearch"
                      type="text"
                      value={staffClinicSearch}
                      onChange={(event) => setStaffClinicSearch(event.target.value)}
                      placeholder="Type clinic name"
                    />
                  </section>

                  <section className="popup-field-group">
                    <label className="popup-label" htmlFor="staffProvince">
                      Province
                    </label>
                    <select
                      className="popup-input"
                      id="staffProvince"
                      value={staffProvince}
                      onChange={(event) => setStaffProvince(event.target.value)}
                    >
                      <option value="">Select Province</option>
                      {provinces.map((province) => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                  </section>

                  <section className="popup-field-group">
                    <label className="popup-label" htmlFor="staffFacilityType">
                      Facility Type
                    </label>
                    <select
                      className="popup-input"
                      id="staffFacilityType"
                      value={staffFacilityType}
                      onChange={(event) => setStaffFacilityType(event.target.value)}
                    >
                      <option value="">Select Facility Type</option>
                      {facilityTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </section>
                </section>

                {staffClinicLoading && (
                  <p className="popup-status-message">Searching clinics...</p>
                )}

                {staffClinicError && (
                  <p className="popup-error-message">{staffClinicError}</p>
                )}

                <section className="popup-results-box" aria-label="Clinic search results">
                  {staffClinicResults.length === 0 ? (
                    <p className="popup-empty-message">No clinics found.</p>
                  ) : (
                    staffClinicResults.map((clinic) => (
                      <article
                        key={clinic.id}
                        className={`popup-clinic-card ${
                          selectedStaffClinic?.id === clinic.id ? "popup-clinic-card-selected" : ""
                        }`}
                      >
                        <section className="popup-clinic-info">
                          <p><strong>Name:</strong> {clinic.facility_name}</p>
                          <p><strong>Province:</strong> {clinic.admin1}</p>
                          <p><strong>Type:</strong> {clinic.facility_type}</p>
                        </section>

                        <button
                          type="button"
                          className="popup-select-btn"
                          onClick={() => setSelectedStaffClinic(clinic)}
                        >
                          {selectedStaffClinic?.id === clinic.id ? "Selected" : "Select"}
                        </button>
                      </article>
                    ))
                  )}
                </section>

                {selectedStaffClinic && (
                  <p className="selected-clinic-note">
                    Selected clinic: <strong>{selectedStaffClinic.facility_name}</strong>
                  </p>
                )}
              </section>

              <footer className="popup-footer">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={resetStaffPopup}
                >
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Save Staff
                </button>
              </footer>
            </form>
          </dialog>
        )}

        {showAdminPopup && (
          <dialog className="popup-dialog" open>
            <form className="popup-form" onSubmit={handleAdminSubmit}>
              <header className="popup-header">
                <h2>Add Admin</h2>
              </header>

              <label className="popup-label" htmlFor="adminEmail">
                Email
              </label>
              <input
                className="popup-input"
                id="adminEmail"
                name="adminEmail"
                type="email"
                required
              />

              <footer className="popup-footer">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAdminPopup(false)}
                  disabled={isSavingAdmin}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="save-btn"
                  disabled={isSavingAdmin}
                >
                  {isSavingAdmin ? "Saving..." : "Save Admin"}
                </button>
              </footer>
            </form>
          </dialog>
        )}

        {showClinicPopup && (
          <dialog className="popup-dialog" open>
            <form className="popup-form" onSubmit={handleClinicSubmit}>
              <header className="popup-header">
                <h2>Edit Clinic</h2>
              </header>

              <label className="popup-label" htmlFor="clinicName">
                Clinic Name
              </label>
              <input
                className="popup-input"
                id="clinicName"
                name="clinicName"
                type="text"
                required
              />

              <label className="popup-label" htmlFor="clinicLocation">
                Location
              </label>
              <input
                className="popup-input"
                id="clinicLocation"
                name="clinicLocation"
                type="text"
                required
              />

              <label className="popup-label" htmlFor="clinicHours">
                Operating Hours
              </label>
              <input
                className="popup-input"
                id="clinicHours"
                name="clinicHours"
                type="text"
                placeholder="e.g. 08:00 - 17:00"
                required
              />

              <label className="popup-label" htmlFor="clinicContact">
                Contact Number
              </label>
              <input
                className="popup-input"
                id="clinicContact"
                name="clinicContact"
                type="tel"
                required
              />

              <footer className="popup-footer">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowClinicPopup(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Save Clinic
                </button>
              </footer>
            </form>
          </dialog>
        )}
      </section>
    </main>
  );
}

export default AdminDashboard;