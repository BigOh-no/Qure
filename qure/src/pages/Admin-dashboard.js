import React, { useEffect, useState } from "react";
import "../styles/Admin.css";
import { useNavigate } from "react-router-dom";
import logo from "../assets/images/TLogo.png";
import { createAdminInvite, logout } from "../lib/auth";
import { createClinicStaffInvite } from "../lib/adminService";
import { searchClinics } from "../pages/clinicService";
import { supabaseClient } from '../lib/supabaseClient';

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
  
  const[staffCount, setStaffCount] = useState(0);
  const[clinicCount, setClinicCount] = useState(0);
  const[isLoadingStats, setIsLoadingStats] = useState(true);

  const [staffList, setStaffList] = useState([]);
  const [clinicList, setClinicList] = useState([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [clinicSearch, setClinicSearch] = useState('');
  const [showStaffList, setShowStaffList] = useState(false);
  const [showClinicList, setShowClinicList] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingClinics, setLoadingClinics] = useState(false);

  //new func 
  const fetchAllStaff = async () => {
  setLoadingStaff(true);
  try {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('email, role')
      .eq('role', 'clinicstaff');
    if (error) throw error;
    setStaffList(data || []);
  } catch (error) {
    console.error('Error fetching staff:', error.message);
  } finally {
    setLoadingStaff(false);
  }
};
//new func 
const removeStaff = async (email) => {
  try {
    const { error } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('email', email);
    if (error) throw error;
    setStaffList((prev) => prev.filter((s) => s.email !== email));
    setSuccessMessage(`Staff member ${email} has been removed.`);
  } catch (error) {
    console.error('Error removing staff:', error.message);
    setErrorMessage('Failed to remove staff member.');
  }
};

  const fetchStaff = async () => {
  setLoadingStaff(true);
  try {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('email, role')
      .eq('role', 'clinicstaff');
    if (error) throw error;
    setStaffList(data);
    setShowStaffList(true);
  } catch (error) {
    console.error('Error fetching staff:', error.message);
  } finally {
    setLoadingStaff(false);
  }
};

const fetchClinics = async () => {
  setLoadingClinics(true);
  try {
    const { data, error } = await supabaseClient
      .from('clinics')
      .select('facility_name, admin1, facility_type')
      .limit(50);
    if (error) throw error;
    setClinicList(data);
    setShowClinicList(true);
  } catch (error) {
    console.error('Error fetching clinics:', error.message);
  } finally {
    setLoadingClinics(false);
  }
};

  const[appointmentsToday, setAppointmentsToday] = useState(0);

  function getTodayDateString(){
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2,"0");
    return `${year}-${month}-${day}`;
  }

  useEffect(()=> {
    fetchDashboardCounts();
  },[]);

  const fetchDashboardCounts = async () => {
    setIsLoadingStats(true);
    setErrorMessage("");
  
    try{
      const {count: totalStaff, error: staffError} = await supabaseClient
        .from("clinicStaff")
        .select("*", { count: "exact", head: true})
      
      if (staffError){
        throw staffError;
      }
      const {count: totalClinics, error: clinicsError} = await supabaseClient
        .from("clinics")
        .select("*", { count: "exact", head: true});

      if (clinicsError){
        throw clinicsError;
      }

      const today = getTodayDateString();

      const {count: totalAppointmentsToday, error: appointmentsError} = await supabaseClient
        .from("appointments")
        .select("*", {count: "exact", head: true})
        .eq("appointment_date", today)
        .eq("status", "booked");

      if (appointmentsError){
        throw appointmentsError;
      }

      setStaffCount(totalStaff || 0);
      setClinicCount(totalClinics ||0);
      setAppointmentsToday(totalAppointmentsToday ||0);
    } catch(error){
      console.error("Failed to load dashboard counts:", error);
      setErrorMessage("Failed to load dashboard statistics");
    }finally{
      setIsLoadingStats(false);
    }
  };

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
    { title: 'Total Staff', value: isLoadingStats ? '...': staffCount },
    { title: 'Total Clinics', value: isLoadingStats ? '...': clinicCount },
    { title: 'Appointments Today', value: isLoadingStats ? '...': appointmentsToday },
    { title: 'Patients Waiting', value: 11 },
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
          limit: 50,
        });

        setStaffClinicResults(results);
      } catch (error) {
        console.error("Clinic search failed:", error);
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

  const [isSavingStaff, setIsSavingStaff] = useState(false);

const handleStaffSubmit = async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);

  if (!selectedStaffClinic) {
    alert("Please select a clinic first.");
    return;
  }

  const email = formData.get("staffEmail")?.toString().trim().toLowerCase();

  setSuccessMessage("");
  setErrorMessage("");
  setIsSavingStaff(true);

  try {
    const result = await createClinicStaffInvite({
      email,
      clinicId: selectedStaffClinic.id,
    });

    setSuccessMessage(
      `Invite sent to ${result.email}. Tell them to check their inbox and set a password.`
    );

    event.target.reset();
    resetStaffPopup();
  } catch (error) {
    console.error("Staff invite failed:", error);
    setErrorMessage(error.message || "Failed to add staff member.");
  } finally {
    setIsSavingStaff(false);
  }
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
          <img src={logo} alt="Qure logo" className="sidebar-logo1" />
        </header>

        <nav className="sidebar-nav">
          <ul>
            <li><button type="button" onClick={() => { setShowStaffList(true); setStaffSearch(''); fetchAllStaff(); }}>Staff</button></li>
            <li><button type="button" onClick={() => { setShowClinicList(true); setClinicList([]); setClinicSearch(''); }}>Clinics</button></li>
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

            <ul className="action-list1">
              <li>
                <button
                  type="button"
                  className="action-btn1"
                  onClick={() => setShowStaffPopup(true)}
                >
                  Add Staff Member
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="action-btn1"
                  onClick={() => setShowAdminPopup(true)}
                >
                  Add Admin
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="action-btn1"
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
                          selectedStaffClinic?.id === clinic.id
                            ? "popup-clinic-card-selected"
                            : ""
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
                <button type="submit" className="save-btn" disabled={isSavingStaff}>
                  {isSavingStaff ? "Saving..." : "Save Staff"}
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

        {showStaffList && (
  <dialog className="popup-dialog" open>
    <form className="popup-form">
      <header className="popup-header">
        <h2>Staff Members</h2>
      </header>
      <input
        className="popup-input"
        type="text"
        placeholder="Search staff..."
        value={staffSearch}
       onChange={async (e) => {
    const value = e.target.value;
    setStaffSearch(value);
    if (value.length > 1) {
      setLoadingStaff(true);
      const { data } = await supabaseClient
        .from('profiles')
        .select('email, role')
        .eq('role', 'clinicstaff')
        .ilike('email', `%${value}%`)
        .limit(20);
      setStaffList(data || []);
      setLoadingStaff(false);
    } else {
      setStaffList([]);
    }
  }}
      />
      {loadingStaff ? (
        <p>Loading...</p>
      ) : (
        <ul className="activity-list">
          {staffList
            .filter((s) => s.email.toLowerCase().includes(staffSearch.toLowerCase()))
            .map((staff, index) => (
  <li key={index} className="staff-list-item">
    <span>{staff.email}</span>
    <button
      type="button"
      className="remove-btn"
      onClick={() => removeStaff(staff.email)}
    >
      Remove
    </button>
  </li>
))}
        </ul>
      )}
      <footer className="popup-footer">
        <button
          type="button"
          className="cancel-btn"
          onClick={() => setShowStaffList(false)}
        >
          Close
        </button>
      </footer>
    </form>
  </dialog>
)}

{showClinicList && (
  <dialog className="popup-dialog" open>
    <form className="popup-form">
      <header className="popup-header">
        <h2>Clinics</h2>
      </header>
      <input
        className="popup-input"
        type="text"
        placeholder="Search clinics..."
        value={clinicSearch}
       onChange={async (e) => {
    const value = e.target.value;
    setClinicSearch(value);
    if (value.length > 1) {
      setLoadingClinics(true);
      const { data } = await supabaseClient
        .from('clinics')
        .select('facility_name, admin1, facility_type')
        .ilike('facility_name', `%${value}%`)
        .limit(20);
      setClinicList(data || []);
      setLoadingClinics(false);
    } else {
      setClinicList([]);
    }
  }}
      />
      {loadingClinics ? (
        <p>Loading...</p>
      ) : (
        <ul className="activity-list">
          {clinicList
            .filter((c) => c.facility_name?.toLowerCase().includes(clinicSearch.toLowerCase()))
            .map((clinic, index) => (
              <li key={index}>{clinic.facility_name} — {clinic.admin1} — {clinic.facility_type}</li>
            ))}
        </ul>
      )}
      <footer className="popup-footer">
        <button
          type="button"
          className="cancel-btn"
          onClick={() => setShowClinicList(false)}
        >
          Close
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