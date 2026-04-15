import React, { useState } from "react";
import "../styles/Admin.css";
import { useNavigate } from "react-router-dom";
import logo from "../assets/images/TLogo.png"

function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  const adminName = "Admin";

  const [showStaffPopup, setShowStaffPopup] = useState(false);
  const [showAdminPopup, setShowAdminPopup] = useState(false);
  const [showClinicPopup, setShowClinicPopup] = useState(false);

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

  const handleStaffSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    const staffData = {
      fullName: formData.get("staffFullName"),
      email: formData.get("staffEmail"),
      role: formData.get("staffRole"),
      clinic: formData.get("staffClinic"),
    };

    console.log("Staff data:", staffData);
    event.target.reset();
    setShowStaffPopup(false);
  };

  const handleAdminSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    const adminData = {
      fullName: formData.get("adminFullName"),
      email: formData.get("adminEmail"),
    };

    console.log("Admin data:", adminData);
    event.target.reset();
    setShowAdminPopup(false);
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
          <img src={logo} alt="Qure logo" className="sidebar-logo"/>
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
                  Add Clinic
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

              <label className="popup-label" htmlFor="staffFullName">
                Full Name
              </label>
              <input
                className="popup-input"
                id="staffFullName"
                name="staffFullName"
                type="text"
                required
              />

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

              <label className="popup-label" htmlFor="staffRole">
                Role
              </label>
              <select
                className="popup-input"
                id="staffRole"
                name="staffRole"
                required
              >
                <option value="">Select role</option>
                <option value="Doctor">Doctor</option>
                <option value="Nurse">Nurse</option>
                <option value="Receptionist">Receptionist</option>
              </select>

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

              <label className="popup-label" htmlFor="adminFullName">
                Full Name
              </label>
              <input
                className="popup-input"
                id="adminFullName"
                name="adminFullName"
                type="text"
                required
              />

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
                >
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Save Admin
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