import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseClient } from "../lib/supabaseClient";
import "../styles/Admin.css";

function AnalyticsPage() {
  const navigate = useNavigate();

  const [waitTimes, setWaitTimes] = useState([]);
  const [noShowRate, setNoShowRate] = useState(0);
  const [queueSummary, setQueueSummary] = useState({
    waiting: 0,
    completed: 0,
    cancelled: 0,
    total: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);

    await Promise.all([
      fetchAverageWaitTimes(),
      fetchNoShowRate(),
      fetchQueueSummary(),
    ]);

    setLoading(false);
  };

  const fetchAverageWaitTimes = async () => {
    const { data, error } = await supabaseClient
      .from("queue_entries")
      .select(`
        id,
        clinic_id,
        joined_at,
        started_at,
        clinics (
          facility_name
        )
      `)
      .not("joined_at", "is", null)
      .not("started_at", "is", null);

    if (error) {
      console.error("Wait time error:", error);
      return;
    }

    const grouped = {};

    data.forEach((entry) => {
      const clinicName =
        entry.clinics?.facility_name || `Clinic ${entry.clinic_id}`;

      const joined = new Date(entry.joined_at);
      const started = new Date(entry.started_at);

      const waitMinutes = Math.round((started - joined) / 60000);
      const hour = joined.getHours();

      let timeOfDay = "";

      if (hour >= 6 && hour < 12) {
        timeOfDay = "Morning";
      } else if (hour >= 12 && hour < 17) {
        timeOfDay = "Afternoon";
      } else {
        timeOfDay = "Evening";
      }

      const key = `${clinicName}-${timeOfDay}`;

      if (!grouped[key]) {
        grouped[key] = {
          clinic: clinicName,
          timeOfDay,
          totalWait: 0,
          count: 0,
        };
      }

      grouped[key].totalWait += waitMinutes;
      grouped[key].count += 1;
    });

    const result = Object.values(grouped).map((item) => ({
      clinic: item.clinic,
      timeOfDay: item.timeOfDay,
      averageWait: Math.round(item.totalWait / item.count),
    }));

    setWaitTimes(result);
  };

  const fetchNoShowRate = async () => {
    const { data, error } = await supabaseClient
      .from("appointments")
      .select("id, status");

    if (error) {
      console.error("No-show error:", error);
      return;
    }

    const totalAppointments = data.length;
    const noShows = data.filter(
      (appointment) => appointment.status === "no-show"
    ).length;

    const rate =
      totalAppointments > 0
        ? Math.round((noShows / totalAppointments) * 100)
        : 0;

    setNoShowRate(rate);
  };

  const fetchQueueSummary = async () => {
    const { data, error } = await supabaseClient
      .from("queue_entries")
      .select("id, status");

    if (error) {
      console.error("Queue summary error:", error);
      return;
    }

    const summary = {
      waiting: data.filter((entry) => entry.status === "waiting").length,
      completed: data.filter((entry) => entry.status === "completed").length,
      cancelled: data.filter((entry) => entry.status === "cancelled").length,
      total: data.length,
    };

    setQueueSummary(summary);
  };

  const exportCSV = () => {
    const rows = [];

    rows.push(["Report", "Clinic / Metric", "Time of Day", "Value"]);

    waitTimes.forEach((item) => {
      rows.push([
        "Average Patient Wait Times",
        item.clinic,
        item.timeOfDay,
        `${item.averageWait} minutes`,
      ]);
    });

    rows.push(["Appointment No-Show Rate", "No-show rate", "-", noShowRate + "%"]);

    rows.push(["Queue Status Summary", "Waiting", "-", queueSummary.waiting]);
    rows.push(["Queue Status Summary", "Completed", "-", queueSummary.completed]);
    rows.push(["Queue Status Summary", "Cancelled", "-", queueSummary.cancelled]);
    rows.push([
      "Queue Status Summary",
      "Total Queue Entries",
      "-",
      queueSummary.total,
    ]);

    const csvContent = rows
        .map((row) =>
            row
            .map((cell) => {
                const value = String(cell).replace(/"/g, '""');
                return '"' + value + '"';
            })
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "analytics-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <main className="admin-page">
      <section className="admin-main">
        <header className="admin-header">
          <h1>Analytics Dashboard</h1>
          <p>Reports and insights</p>

          <button
            type="button"
            className="action-btn1"
            onClick={exportCSV}
          >
            Export CSV
          </button>

          <button
            type="button"
            className="logout-btn"
            onClick={() => navigate("/admin")}
          >
            Back to Admin
          </button>
        </header>

        {loading ? (
          <p>Loading analytics...</p>
        ) : (
          <section className="dashboard-grid">
            <article className="dashboard-card">
              <h2>Average Patient Wait Times</h2>
              <p>Grouped by clinic and time of day.</p>

              {waitTimes.length === 0 ? (
                <p>No wait-time data available yet.</p>
              ) : (
                <ul className="activity-list">
                  {waitTimes.map((item, index) => (
                    <li key={index}>
                      {item.clinic} — {item.timeOfDay}: {item.averageWait} minutes
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="dashboard-card">
              <h2>Appointment No-Show Rate</h2>
              <p className="stat-value">{noShowRate}%</p>
            </article>

            <article className="dashboard-card">
              <h2>Queue Status Summary</h2>

              <ul className="activity-list">
                <li>Waiting: {queueSummary.waiting}</li>
                <li>Completed: {queueSummary.completed}</li>
                <li>Cancelled: {queueSummary.cancelled}</li>
                <li>Total Queue Entries: {queueSummary.total}</li>
              </ul>
            </article>
          </section>
        )}
      </section>
    </main>
  );
}

export default AnalyticsPage;