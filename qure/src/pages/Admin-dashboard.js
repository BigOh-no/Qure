import React, { useState } from 'react';
import '../styles/Admin.css';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/images/TLogo.png';
import { createAdminInvite, logout } from '../lib/auth';
import { supabaseClient } from '../lib/supabaseClient'; // Supabase import

function AdminDashboard() {
  const navigate = useNavigate();

  const adminName = 'Admin';

  const [showStaffPopup, setShowStaffPopup] = useState(false);
  const [showAdminPopup, setShowAdminPopup] = useState(false);
  const [showClinicPopup, setShowClinicPopup] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  //the state variables for the staff and clinic lists
  const [staffList, setStaffList] = useState([]);
const [clinicList, setClinicList] = useState([]);
const [staffSearch, setStaffSearch] = useState('');
const [clinicSearch, setClinicSearch] = useState('');
const [showStaffList, setShowStaffList] = useState(false);
const [showClinicList, setShowClinicList] = useState(false);
const [loadingStaff, setLoadingStaff] = useState(false);
const [loadingClinics, setLoadingClinics] = useState(false);

  const stats = [
    { title: 'Total Staff', value: 18 },
    { title: 'Total Clinics', value: 5 },
    { title: 'Appointments Today', value: 24 },
    { title: 'Patients Waiting', value: 11 },
  ];

  const recentActivity = [
    'Dr Smith added to Hillbrow Clinic',
    'New admin created',
    'Clinic hours updated',
  ];
//functions to fetch staff and clinics from Supabase
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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error.message);
      navigate('/');
    }
  };

  const handleStaffSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    const staffData = {
      email: formData.get('staffEmail'),
      clinic: formData.get('staffClinic'),
    };

    console.log('Staff data:', staffData);
    event.target.reset();
    setShowStaffPopup(false);
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
      // keep popup open on error
    } finally {
      setIsSavingAdmin(false);
    }
  };

  const handleClinicSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    const clinicData = {
      clinicName: formData.get('clinicName'),
      location: formData.get('clinicLocation'),
      operatingHours: formData.get('clinicHours'),
      contactNumber: formData.get('clinicContact'),
    };

    console.log('Clinic data:', clinicData);
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
    <li><button type="button" onClick={() => { setShowStaffList(true); setStaffList([]); setStaffSearch(''); }}>Staff</button></li>
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
          <dialog className="popup-dialog" open>
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

              <label className="popup-label" htmlFor="staffClinic">
                Assigned Clinic
              </label>
              <input
                className="popup-input"
                id="staffClinic"
                name="staffClinic"
                type="text"
                required
              />

              <footer className="popup-footer">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowStaffPopup(false)}
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
              <li key={index}>{staff.email}</li>
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