import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/staff.css";
import logo from "../assets/images/TLogo.png";

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([
    { id: 1, name: "John Doe", time: "09:00", status: "Waiting" },
    { id: 2, name: "Jane Smith", time: "09:15", status: "Waiting" },
    { id: 3, name: "Ali Khan", time: "09:30", status: "In Consultation" }
  ]);

  const updateStatus = (id, newStatus) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: newStatus } : p
      )
    );
  };

  const getStatusClass = (status) => {
    if (status === "Waiting") return "status waiting";
    if (status === "In Consultation") return "status progress";
    return "status done";
  };

  return (
    <main className="layout">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <figure className="sidebar-logo-figure">
          <img src={logo} alt="Qure logo" className="sidebar-logo" />
        </figure>

        <nav className="nav">
  <section className="nav-top">
    <button className="nav-item active">Dashboard</button>
    <button className="nav-item">Queue</button>
    <button className="nav-item">Patients</button>
  </section>
  <footer className="nav-bottom">
    <button className="nav-item logout" onClick={() => navigate("/")}>Logout</button>
  </footer>
</nav>
      </aside>

      {/* MAIN CONTENT */}
      <section className="main">

        <header className="topbar">
          <h1 className="topbar-title">Staff Dashboard</h1>
          <p className="topbar-subtitle">Hillbrow Clinic</p>
        </header>

        <article className="card">
          <header className="card-header">
            <h2>Today's Queue</h2>
            <span className="patient-count">{patients.length} patients</span>
          </header>

          <table className="table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td>{patient.name}</td>
                  <td>{patient.time}</td>
                  <td>
                    <span className={getStatusClass(patient.status)}>
                      {patient.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn start"
                      onClick={() => updateStatus(patient.id, "In Consultation")}
                    >
                      Start
                    </button>
                    <button
                      className="btn complete"
                      onClick={() => updateStatus(patient.id, "Complete")}
                    >
                      Complete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
    </main>
  );
}