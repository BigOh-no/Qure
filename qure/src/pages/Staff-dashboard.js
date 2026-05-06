import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/staff.css";
import logo from "../assets/images/TLogo.png";
import{
  getStaffClinicAndQueue,
  updateQueueStatus,
} from "./staffService";

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [clinic, setClinic] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStaffQueue() {
      try {
        setLoading(true);

        const { clinicName, patients } = await getStaffClinicAndQueue();

        setClinic(clinicName);
        setPatients(patients);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false)
      }
    }
    loadStaffQueue();
  }, []);
  const updateStatus = async (id, newStatus) => {
    try {
      await updateQueueStatus(id, newStatus);
      setPatients((prev) =>
        prev.map((p) =>
          p.id === id ? {...p, status: newStatus} : p
        )
      );
    }
    catch (err){
      console.error(err);
    }
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
          <p className="topbar-subtitle">{clinic || "Loading..."}</p>
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
              {loading ? (
                <tr>
                  <td colSpan="4">Loading queue...</td>
                </tr>
              ): patients.length === 0 ?(
                <tr>
                  <td colSpan="4">No patients in queue</td>
                </tr>
              ): (
                patients.map((entry, index) => (
                  <tr key={entry.id}>
                    <td>Patient {index+1}</td>
                    <td>{new Date(entry.joined_at).toLocaleDateString()}</td>
                    <td>
                      <span className={getStatusClass(entry.status)}>
                        {entry.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn start"
                        onClick={() => updateStatus(entry.id, "In consultation")}
                      >
                        Start
                      </button>
                      <button
                        className="btn complete"
                        onClick={() => updateStatus(entry.id, "Completed")}
                      >
                        Complete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </article>
      </section>
    </main>
  );
}