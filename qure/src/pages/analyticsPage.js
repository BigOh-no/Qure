import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseClient } from "../lib/supabaseClient";
import "../styles/Admin.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

  // Calculates the average patient wait time.
  // Wait time is measured from when a patient joins the queue until they start consultation.
  // This uses the "joined_at" time and the "started_at" time from the queue_entries table.
  //
  // Formula:
  // wait time for one patient = started_at - joined_at
  // average wait time = total wait time / number of patients
  //
  // In this code:
  // waitMinutes = the number of minutes between joined_at and started_at
  // totalWait = the sum of all wait times for a clinic and time of day
  // count = the number of patients included in that clinic/time-of-day group
  // averageWait = totalWait / count

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

      if (waitMinutes < 0) {
        return;
      }

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

  // Calculates the appointment no-show rate.
  // Only appointments that are more than 1 hour past their appointment time are included.
  // An appointment is counted as a no-show if its status is still "booked".
  // An appointment is counted as attended if its status is "checked_in".
  //
  // Formula:
  // No-show rate = (number of no-shows / total relevant appointments) * 100
  //
  // In this code:
  // noShowCount = appointments with status "booked"
  // checkedInCount = appointments with status "checked_in"
  // totalRelevantAppointments = noShowCount + checkedInCount
  const fetchNoShowRate = async () => {
    const { data, error } = await supabaseClient
      .from("appointments")
      .select("id, appointment_date, appointment_time, status");

    if (error) {
      console.error("No-show error:", error);
      return;
    }

    const now = new Date();

    const eligibleAppointments = data.filter((appointment) => {
      if (!appointment.appointment_date || !appointment.appointment_time) {
        return false;
      }

      const appointmentDateTime = new Date(
        `${appointment.appointment_date}T${appointment.appointment_time}`
      );

      const oneHourAfterAppointment = new Date(
        appointmentDateTime.getTime() + 60 * 60 * 1000
      );

      return now > oneHourAfterAppointment;
    });

    const checkedInCount = eligibleAppointments.filter(
      (appointment) => appointment.status === "checked_in"
    ).length;

    const noShowCount = eligibleAppointments.filter(
      (appointment) => appointment.status === "booked"
    ).length;

    const totalRelevantAppointments = checkedInCount + noShowCount;

    const rate =
      totalRelevantAppointments > 0
        ? Math.round((noShowCount / totalRelevantAppointments) * 100)
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

    const today = new Date().toLocaleDateString("en-GB");

    rows.push([`Analytics Report for Qure`]);
    rows.push([`Date: ${today}`]);
    rows.push([]);

    rows.push(["Average Patient Wait Times"]);
    rows.push(["Clinic", "Time of Day", "Average Wait Time"]);

    if (waitTimes.length === 0) {
      rows.push(["No wait-time data available yet."]);
    } else {
      waitTimes.forEach((item) => {
        rows.push([
          item.clinic,
          item.timeOfDay,
          `${item.averageWait} minutes`,
        ]);
      });
    }

    rows.push([]);

    rows.push(["Appointment No-Show Rate"]);
    rows.push(["No-show rate", `${noShowRate}%`]);

    rows.push([]);

    rows.push(["Queue Status Summary"]);
    rows.push(["Waiting", queueSummary.waiting]);
    rows.push(["Completed", queueSummary.completed]);
    rows.push(["Cancelled", queueSummary.cancelled]);
    rows.push(["Total Queue Entries", queueSummary.total]);

    const csvContent = rows
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? "").replace(/"/g, '""');
            return `"${value}"`;
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
    link.download = `qure-analytics-report-${today}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    const today = new Date().toLocaleDateString("en-GB");

    const darkRed = [139, 0, 0];
    const lightRed = [255, 245, 245];

    doc.setFillColor(...darkRed);
    doc.rect(0, 0, 210, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("Analytics Report for Qure", 14, 18);

    doc.setFontSize(10);
    doc.text(`Date: ${today}`, 150, 18);

    doc.setTextColor(0, 0, 0);

    let y = 40;

    doc.setFontSize(15);
    doc.setTextColor(...darkRed);
    doc.text("Average Patient Wait Times", 14, y);

    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["Clinic", "Time of Day", "Average Wait Time"]],
      body:
        waitTimes.length === 0
          ? [["No wait-time data available yet.", "-", "-"]]
          : waitTimes.map((item) => [
              item.clinic,
              item.timeOfDay,
              `${item.averageWait} minutes`,
            ]),
      headStyles: {
        fillColor: darkRed,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: lightRed,
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      margin: { left: 14, right: 14 },
    });

    y = doc.lastAutoTable.finalY + 15;

    doc.setFontSize(15);
    doc.setTextColor(...darkRed);
    doc.text("Appointment No-Show Rate", 14, y);

    y += 8;

    doc.setFillColor(255, 245, 245);
    doc.roundedRect(14, y, 70, 18, 3, 3, "F");

    doc.setTextColor(...darkRed);
    doc.setFontSize(22);
    doc.text(`${noShowRate}%`, 20, y + 12);

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text("No-show rate", 45, y + 12);

    y += 35;

    doc.setFontSize(15);
    doc.setTextColor(...darkRed);
    doc.text("Queue Status Summary", 14, y);

    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["Status", "Count"]],
      body: [
        ["Waiting", queueSummary.waiting],
        ["Completed", queueSummary.completed],
        ["Cancelled", queueSummary.cancelled],
        ["Total Queue Entries", queueSummary.total],
      ],
      headStyles: {
        fillColor: darkRed,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: lightRed,
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      margin: { left: 14, right: 14 },
    });

    doc.save(`qure-analytics-report-${today}.pdf`);
  };

  return (
    <main className="admin-page">
      <section className="admin-main">
        <header className="admin-header">
          <h1>Analytics Dashboard</h1>
          <p>Reports and insights</p>

          <section className="export-buttons">
            <button
              type="button"
              className="action-btn1"
              onClick={exportCSV}
            >
              Export CSV
            </button>

            <button
              type="button"
              className="action-btn1"
              onClick={exportPDF}
            >
              Export PDF
            </button>
          </section>

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