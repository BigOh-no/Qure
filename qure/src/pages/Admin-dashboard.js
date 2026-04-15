import React from "react";
import "../styles/Admin.css";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const navigate = useNavigate();
  const handleLogout = () => {
    navigate("/");
  }
  const adminName = "Admin";

  const stats = [
    { title: "Total Staff", value: 18 },
    { title: "Total Clinics", value: 5 },
    { title: "Appointments Today", value: 24 },
    { title: "Patients Waiting", value: 11 },
  ];

  const quickActions = [
    "Add Staff Member",
    "Add Admin",
    "Add Clinic",
  ];

  const recentActivity = [
    "Dr Smith added to Hillbrow Clinic",
    "New admin created",
    "Clinic hours updated",
  ];

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <header className="sidebar-header">
          <h2>Qure</h2>
        </header>

        <nav className="sidebar-nav">
          <ul>
            <li><button>Staff</button></li>
            <li><button>Clinics</button></li>
            <li><button>Analytics</button></li>
            <li><button>Profile</button></li>
          </ul>
        </nav>

        <footer className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
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
              {quickActions.map((action, index) => (
                <li key={index}>
                  <button className="action-btn">{action}</button>
                </li>
              ))}
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
      </section>
    </main>
  );
}

export default AdminDashboard;