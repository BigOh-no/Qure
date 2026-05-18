import React, { useEffect, useState } from "react";
import "../styles/Admin.css";
import { useNavigate } from "react-router-dom";
import logo from "../assets/images/TLogo.png";
import { createAdminInvite, logout } from "../lib/auth";
import { createClinicStaffInvite } from "../lib/adminService";
import { searchClinics } from "../pages/clinicService";
import { supabaseClient } from "../lib/supabaseClient";

function AdminDashboard() {
  const navigate = useNavigate();

  const [adminName, setAdminName] = useState("Admin");

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

  const [staffCount, setStaffCount] = useState(0);
  const [clinicCount, setClinicCount] = useState(0);
  const [patientsWaiting, setPatientsWaiting] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const [staffList, setStaffList] = useState([]);
  const [clinicList, setClinicList] = useState([]);
  const [staffSearch, setStaffSearch] = useState("");
  const [clinicSearch, setClinicSearch] = useState("");
  const [showStaffList, setShowStaffList] = useState(false);
  const [showClinicList, setShowClinicList] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingClinics, setLoadingClinics] = useState(false);

  const [staffToRemove, setStaffToRemove] = useState(null);
  const [editClinicSearch, setEditClinicSearch] = useState("");
  const [editClinicResults, setEditClinicResults] = useState([]);
  const [selectedEditClinic, setSelectedEditClinic] = useState(null);
  const [editClinicLoading, setEditClinicLoading] = useState(false);
  const [editClinicError, setEditClinicError] = useState("");

  const [clinicOpeningHour, setClinicOpeningHour] = useState("08:00");
  const [clinicClosingHour, setClinicClosingHour] = useState("17:00");

  const [showProfilePopup, setShowProfilePopup] = useState(false);

  const [newUsername, setNewUsername] = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [appointmentsToday, setAppointmentsToday] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);

  function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const clinicHourOptions = Array.from({ length: 24 }, (_, index) => {
    const hour = String(index).padStart(2, "0");
    return `${hour}:00`;
  });

  function formatDisplayHour(hourValue) {
    const hour = Number(hourValue.slice(0, 2));

    if (hour === 0) return "12:00 AM";
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return "12:00 PM";

    return `${hour - 12}:00 PM`;
  }

  function normalizeClinicHour(value, fallback) {
    if (!value) return fallback;
    return String(value).slice(0, 2) + ":00";
  }

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    const fetchAdminName = async () => {
      const {
        data: { user },
        error,
      } = await supabaseClient.auth.getUser();

      if (error) {
        console.error(error);
        return;
      }

      if (!user) return;

      let displayName = user.user_metadata?.full_name || user.user_metadata?.name;

      if (!displayName && user.email) {
        displayName = user.email.split("@")[0];
      }

      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("user_name")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Failed to fetch profile username:", profileError.message);
      }

      if (profile?.user_name) {
        setAdminName(profile.user_name);
        setNewUsername(profile.user_name);
      } else {
        setAdminName(displayName || "Admin");
        setNewUsername("");
      }
    };

    fetchAdminName();
  }, []);

  useEffect(() => {
    fetchDashboardCounts();
    fetchRecentActivity();

    const intervalId = setInterval(() => {
      fetchDashboardCounts();
      fetchRecentActivity();
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchAllStaff = async () => {
    setLoadingStaff(true);

    try {
      const { data, error } = await supabaseClient
        .from("profiles")
        .select("email, role, user_name")
        .eq("role", "clinicstaff")
        .order("user_name", { ascending: true });

      if (error) throw error;

      setStaffList(data || []);
    } catch (error) {
      console.error("Error fetching staff:", error.message);
    } finally {
      setLoadingStaff(false);
    }
  };

  const removeStaff = async (email) => {
    try {
      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (profileError) throw profileError;

      const { error: clinicStaffError } = await supabaseClient
        .from("clinicStaff")
        .delete()
        .eq("staff_id", profile.id);

      if (clinicStaffError) throw clinicStaffError;

      const { error } = await supabaseClient
        .from("profiles")
        .delete()
        .eq("email", email);

      if (error) throw error;

      setStaffList((prev) => prev.filter((staff) => staff.email !== email));
      setSuccessMessage(`Staff member ${email} has been removed.`);
      await fetchDashboardCounts();
    } catch (error) {
      console.error("Error removing staff:", error.message);
      setErrorMessage("Failed to remove staff member.");
    }
  };

  const fetchDashboardCounts = async () => {
    setIsLoadingStats(true);
    setErrorMessage("");

    try {
      const { count: totalStaff, error: staffError } = await supabaseClient
        .from("clinicStaff")
        .select("*", { count: "exact", head: true });

      if (staffError) throw staffError;

      const { count: totalClinics, error: clinicsError } = await supabaseClient
        .from("clinics")
        .select("*", { count: "exact", head: true });

      if (clinicsError) throw clinicsError;

      const today = getTodayDateString();

      const { count: totalAppointmentsToday, error: appointmentsError } =
        await supabaseClient
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("appointment_date", today)
          .eq("status", "booked");

      if (appointmentsError) throw appointmentsError;

      const { count: totalPatientsWaiting, error: waitingError } =
        await supabaseClient
          .from("queue_entries")
          .select("*", { count: "exact", head: true })
          .eq("status", "waiting");

      if (waitingError) throw waitingError;

      setStaffCount(totalStaff || 0);
      setClinicCount(totalClinics || 0);
      setAppointmentsToday(totalAppointmentsToday || 0);
      setPatientsWaiting(totalPatientsWaiting || 0);
    } catch (error) {
      console.error("Failed to load dashboard counts:", error);
      setErrorMessage("Failed to load dashboard statistics");
    } finally {
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
    { title: "Total Staff", value: isLoadingStats ? "..." : staffCount },
    { title: "Total Clinics", value: isLoadingStats ? "..." : clinicCount },
    {
      title: "Appointments Today",
      value: isLoadingStats ? "..." : appointmentsToday,
    },
    {
      title: "Patients Waiting",
      value: isLoadingStats ? "..." : patientsWaiting,
    },
  ];

  const fetchRecentActivity = async () => {
    try {
      const { data, error } = await supabaseClient
        .from("recent_activity")
        .select("message, created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;

      setRecentActivity(data || []);
    } catch (error) {
      console.error("Failed to fetch recent activity:", error.message);
    }
  };

  const addRecentActivity = async (message) => {
    try {
      const { error } = await supabaseClient.from("recent_activity").insert([
        {
          message: message,
        },
      ]);

      if (error) throw error;

      await fetchRecentActivity();
    } catch (error) {
      console.error("Failed to add recent activity:", error.message);
    }
  };

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

      await addRecentActivity(
        `${result.email} added as staff member to ${selectedStaffClinic.facility_name}`
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

      await addRecentActivity("New admin added");

      event.target.reset();
      setShowAdminPopup(false);
    } catch (error) {
      console.error("Admin invite failed:", error);
      setErrorMessage(error.message || "Failed to add admin.");
    } finally {
      setIsSavingAdmin(false);
    }
  };

  const handleClinicSubmit = async (event) => {
    event.preventDefault();

    if (!selectedEditClinic) {
      alert("Please select a clinic first.");
      return;
    }

    const openingTime = clinicOpeningHour;
    const closingTime = clinicClosingHour;

    if (!openingTime || !closingTime) {
      alert("Please choose both opening and closing hours.");
      return;
    }

    if (openingTime >= closingTime) {
      alert("Closing hour must be after opening hour.");
      return;
    }

    setSuccessMessage("");
    setErrorMessage("");

    try {
      const { error } = await supabaseClient
        .from("clinics")
        .update({
          open_t: openingTime,
          closed_t: closingTime,
        })
        .eq("id", selectedEditClinic.id);

      if (error) throw error;

      setSuccessMessage(
        `Operating hours updated for ${selectedEditClinic.facility_name}.`
      );

      await addRecentActivity(`${selectedEditClinic.facility_name} hours updated`);
      await fetchDashboardCounts();
      resetEditClinicPopup();
    } catch (error) {
      console.error("Failed to update clinic hours:", error);
      setErrorMessage("Failed to update clinic operating hours.");
    }
  };

  useEffect(() => {
    const runEditClinicSearch = async () => {
      if (!showClinicPopup) return;

      setEditClinicError("");

      if (!editClinicSearch.trim()) {
        setEditClinicResults([]);
        return;
      }

      setEditClinicLoading(true);

      try {
        const results = await searchClinics({
          searchTerm: editClinicSearch,
          limit: 50,
        });

        setEditClinicResults(results);
      } catch (error) {
        console.error("Edit clinic search failed:", error);
        setEditClinicError("Failed to search clinics.");
      } finally {
        setEditClinicLoading(false);
      }
    };

    runEditClinicSearch();
  }, [showClinicPopup, editClinicSearch]);

  const resetEditClinicPopup = () => {
    setShowClinicPopup(false);
    setEditClinicSearch("");
    setEditClinicResults([]);
    setSelectedEditClinic(null);
    setEditClinicError("");
    setEditClinicLoading(false);
    setClinicOpeningHour("08:00");
    setClinicClosingHour("17:00");
  };

  const handleSelectEditClinic = (clinic) => {
    setSelectedEditClinic(clinic);
    setClinicOpeningHour(normalizeClinicHour(clinic.open_t, "08:00"));
    setClinicClosingHour(normalizeClinicHour(clinic.closed_t, "17:00"));
  };

  const formatActivityDateTime = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    return date.toLocaleString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openProfilePopup = async () => {
    setProfileError("");
    setPasswordError("");
    setNewPassword("");
    setConfirmPassword("");
    setShowProfilePopup(true);

    try {
      const {
        data: { user },
        error,
      } = await supabaseClient.auth.getUser();

      if (error) throw error;
      if (!user) return;

      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("user_name")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Failed to fetch profile username:", profileError.message);
      }

      setNewUsername(profile?.user_name || "");

      setTimeout(() => {
        setNewUsername(profile?.user_name || "");
      }, 100);
    } catch (error) {
      console.error(error);
      setNewUsername("");
    }
  };

  const handleUsernameUpdate = async () => {
    const trimmedUsername = newUsername.trim();

    if (!trimmedUsername) {
      setProfileError("Username cannot be empty.");
      return;
    }

    setSuccessMessage("");
    setErrorMessage("");
    setProfileError("");
    setIsSavingUsername(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("No logged-in user found.");

      const { error } = await supabaseClient
        .from("profiles")
        .update({ user_name: trimmedUsername })
        .eq("id", user.id);

      if (error) throw error;

      setAdminName(trimmedUsername);
      setShowProfilePopup(false);
      setSuccessMessage("Username updated successfully.");
    } catch (error) {
      console.error("Failed to update username:", error.message);
      setProfileError("Failed to update username.");
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handlePasswordUpdate = async () => {
    const trimmedPassword = newPassword.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    setSuccessMessage("");
    setErrorMessage("");
    setPasswordError("");

    if (!trimmedPassword || !trimmedConfirmPassword) {
      setPasswordError("Please enter and confirm your new password.");
      return;
    }

    if (trimmedPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsSavingPassword(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("No logged-in user found.");

      const { error } = await supabaseClient.auth.updateUser({
        password: trimmedPassword,
      });

      if (error) throw error;

      setNewPassword("");
      setConfirmPassword("");
      setShowProfilePopup(false);
      setSuccessMessage("Password updated successfully.");
    } catch (error) {
      console.error("Failed to update password:", error.message);
      setPasswordError(error.message || "Failed to update password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <header className="sidebar-header">
          <img src={logo} alt="Qure logo" className="sidebar-logo1" />
        </header>

        <nav className="sidebar-nav">
          <ul>
            <li>
              <button
                type="button"
                onClick={() => {
                  setShowStaffList(true);
                  setStaffSearch("");
                  fetchAllStaff();
                }}
              >
                Staff
              </button>
            </li>

            <li>
              <button
                type="button"
                onClick={() => {
                  setShowClinicList(true);
                  setClinicList([]);
                  setClinicSearch("");
                }}
              >
                Clinics
              </button>
            </li>

            <li>
              <button type="button" onClick={() => navigate("/analytics")}>
                Analytics
              </button>
            </li>

            <li>
              <button type="button" onClick={openProfilePopup}>
                Profile
              </button>
            </li>
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

        {errorMessage && <p className="admin-error-message">{errorMessage}</p>}

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
              {recentActivity.length === 0 ? (
                <li>No recent activity yet.</li>
              ) : (
                recentActivity.map((activity, index) => (
                  <li key={index} className="activity-list-item">
                    <p className="activity-message">{activity.message}</p>
                    <time
                      className="activity-time"
                      dateTime={activity.created_at}
                    >
                      {formatActivityDateTime(activity.created_at)}
                    </time>
                  </li>
                ))
              )}
            </ul>
          </article>
        </section>

        {showStaffPopup && (
          <section className="admin-modal-overlay" onClick={resetStaffPopup}>
            <dialog
              className="popup-dialog popup-dialog-wide"
              open
              onClick={(event) => event.stopPropagation()}
            >
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
                        onChange={(event) =>
                          setStaffClinicSearch(event.target.value)
                        }
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
                        onChange={(event) =>
                          setStaffProvince(event.target.value)
                        }
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
                        onChange={(event) =>
                          setStaffFacilityType(event.target.value)
                        }
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

                  <section
                    className="popup-results-box"
                    aria-label="Clinic search results"
                  >
                    {staffClinicSearch.trim() !== "" ||
                    staffProvince ||
                    staffFacilityType ? (
                      staffClinicResults.length === 0 ? (
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
                              <p>
                                <strong>Name:</strong> {clinic.facility_name}
                              </p>
                              <p>
                                <strong>Province:</strong> {clinic.admin1}
                              </p>
                              <p>
                                <strong>Type:</strong> {clinic.facility_type}
                              </p>
                            </section>

                            <button
                              type="button"
                              className="popup-select-btn"
                              onClick={() => {
                                setSelectedStaffClinic(clinic);
                                setStaffProvince(clinic.admin1 || "");
                                setStaffFacilityType(
                                  clinic.facility_type || ""
                                );
                              }}
                            >
                              {selectedStaffClinic?.id === clinic.id
                                ? "Selected"
                                : "Select"}
                            </button>
                          </article>
                        ))
                      )
                    ) : null}
                  </section>

                  {selectedStaffClinic && (
                    <p className="selected-clinic-note">
                      Selected clinic:{" "}
                      <strong>{selectedStaffClinic.facility_name}</strong>
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

                  <button
                    type="submit"
                    className="save-btn"
                    disabled={isSavingStaff}
                  >
                    {isSavingStaff ? "Saving..." : "Save Staff"}
                  </button>
                </footer>
              </form>
            </dialog>
          </section>
        )}

        {showAdminPopup && (
          <section
            className="admin-modal-overlay"
            onClick={() => setShowAdminPopup(false)}
          >
            <dialog
              className="popup-dialog"
              open
              onClick={(event) => event.stopPropagation()}
            >
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
          </section>
        )}

        {showClinicPopup && (
          <section className="admin-modal-overlay" onClick={resetEditClinicPopup}>
            <dialog
              className="popup-dialog popup-dialog-wide"
              open
              onClick={(event) => event.stopPropagation()}
            >
              <form className="popup-form" onSubmit={handleClinicSubmit}>
                <header className="popup-header">
                  <h2>Edit Clinic Hours</h2>
                </header>

                <section className="clinic-search-section">
                  <section className="popup-field-group">
                    <label className="popup-label" htmlFor="editClinicSearch">
                      Search Clinic Name
                    </label>

                    <input
                      className="popup-input"
                      id="editClinicSearch"
                      type="text"
                      value={editClinicSearch}
                      onChange={(event) =>
                        setEditClinicSearch(event.target.value)
                      }
                      placeholder="Type clinic name"
                    />
                  </section>

                  {editClinicLoading && (
                    <p className="popup-status-message">Searching clinics...</p>
                  )}

                  {editClinicError && (
                    <p className="popup-error-message">{editClinicError}</p>
                  )}

                  <section
                    className="popup-results-box"
                    aria-label="Clinic search results"
                  >
                    {editClinicSearch.trim() !== "" &&
                    editClinicResults.length === 0 ? (
                      <p className="popup-empty-message">No clinics found.</p>
                    ) : (
                      editClinicResults.map((clinic) => (
                        <article
                          key={clinic.id}
                          className={`popup-clinic-card ${
                            selectedEditClinic?.id === clinic.id
                              ? "popup-clinic-card-selected"
                              : ""
                          }`}
                        >
                          <section className="popup-clinic-info">
                            <p>
                              <strong>Name:</strong> {clinic.facility_name}
                            </p>
                            <p>
                              <strong>Province:</strong> {clinic.admin1}
                            </p>
                            <p>
                              <strong>Type:</strong> {clinic.facility_type}
                            </p>
                            <p>
                              <strong>Current Hours:</strong>{" "}
                              {normalizeClinicHour(clinic.open_t, "08:00")} -{" "}
                              {normalizeClinicHour(clinic.closed_t, "17:00")}
                            </p>
                          </section>

                          <button
                            type="button"
                            className="popup-select-btn"
                            onClick={() => handleSelectEditClinic(clinic)}
                          >
                            {selectedEditClinic?.id === clinic.id
                              ? "Selected"
                              : "Select"}
                          </button>
                        </article>
                      ))
                    )}
                  </section>

                  {selectedEditClinic && (
                    <p className="selected-clinic-note">
                      Selected clinic:{" "}
                      <strong>{selectedEditClinic.facility_name}</strong>
                    </p>
                  )}
                </section>

                <h3 className="popup-subheading">Set Operating Hours</h3>

                <section
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    padding: "1rem",
                    border: "1px solid #f0d0d0",
                    borderRadius: "14px",
                    backgroundColor: "#fffafa",
                  }}
                >
                  <section className="popup-field-group">
                    <label className="popup-label" htmlFor="clinicOpeningHour">
                      Opening Hour
                    </label>

                    <select
                      className="popup-input"
                      id="clinicOpeningHour"
                      value={clinicOpeningHour}
                      onChange={(event) =>
                        setClinicOpeningHour(event.target.value)
                      }
                    >
                      {clinicHourOptions.map((hour) => (
                        <option key={hour} value={hour}>
                          {formatDisplayHour(hour)}
                        </option>
                      ))}
                    </select>
                  </section>

                  <section className="popup-field-group">
                    <label className="popup-label" htmlFor="clinicClosingHour">
                      Closing Hour
                    </label>

                    <select
                      className="popup-input"
                      id="clinicClosingHour"
                      value={clinicClosingHour}
                      onChange={(event) =>
                        setClinicClosingHour(event.target.value)
                      }
                    >
                      {clinicHourOptions.map((hour) => (
                        <option key={hour} value={hour}>
                          {formatDisplayHour(hour)}
                        </option>
                      ))}
                    </select>
                  </section>

                  <section
                    style={{
                      gridColumn: "1 / -1",
                      padding: "0.9rem 1rem",
                      borderRadius: "12px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #f0d0d0",
                      color: "#8b0000",
                      fontWeight: "700",
                      textAlign: "center",
                    }}
                  >
                    Selected hours: {clinicOpeningHour} - {clinicClosingHour}
                  </section>
                </section>

                <footer className="popup-footer">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={resetEditClinicPopup}
                  >
                    Cancel
                  </button>

                  <button type="submit" className="save-btn">
                    Save Clinic Hours
                  </button>
                </footer>
              </form>
            </dialog>
          </section>
        )}

        {showStaffList && (
          <section
            className="admin-modal-overlay"
            onClick={() => setShowStaffList(false)}
          >
            <dialog
              className="popup-dialog popup-dialog-wide"
              open
              onClick={(event) => event.stopPropagation()}
            >
              <form className="popup-form">
                <header className="popup-header">
                  <h2>Staff Members</h2>
                </header>

                <input
                  className="popup-input"
                  type="text"
                  placeholder="Search staff by name or email..."
                  value={staffSearch}
                  onChange={async (event) => {
                    const value = event.target.value;
                    setStaffSearch(value);

                    const searchTerm = value.trim();

                    setLoadingStaff(true);

                    try {
                      if (searchTerm.length >= 1) {
                        const { data: emailMatches, error: emailError } = await supabaseClient
                          .from("profiles")
                          .select("email, role, user_name")
                          .eq("role", "clinicstaff")
                          .ilike("email", `%${searchTerm}%`)
                          .limit(50);

                        if (emailError) throw emailError;

                        const { data: nameMatches, error: nameError } = await supabaseClient
                          .from("profiles")
                          .select("email, role, user_name")
                          .eq("role", "clinicstaff")
                          .ilike("user_name", `%${searchTerm}%`)
                          .limit(50);

                        if (nameError) throw nameError;

                        const allStaff = [
                          ...(emailMatches || []),
                          ...(nameMatches || []),
                        ];

                        const uniqueStaff = allStaff.filter(
                          (staff, index, self) =>
                            index === self.findIndex((s) => s.email === staff.email)
                        );

                        setStaffList(uniqueStaff);
                      } else {
                        await fetchAllStaff();
                      }
                    } catch (error) {
                      console.error("Error searching staff:", error.message);
                      setStaffList([]);
                    } finally {
                      setLoadingStaff(false);
                    }
                  }}
                />

                {loadingStaff ? (
                  <p>Loading...</p>
                ) : staffList.length === 0 ? (
                  <p className="popup-empty-message">No clinic staff found.</p>
                ) : (
                  <section className="staff-table-wrapper">
                    <table className="staff-table">
                      <thead>
                        <tr>
                          <th>User Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Remove</th>
                        </tr>
                      </thead>

                      <tbody>
                        {staffList.map((staff, index) => (
                          <tr key={index}>
                            <td>{staff.user_name || "No username"}</td>
                            <td>{staff.email}</td>
                            <td>staff</td>
                            <td>
                              <button
                                type="button"
                                className="remove-btn"
                                onClick={() => setStaffToRemove(staff.email)}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
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
          </section>
        )}

        {showClinicList && (
          <section
            className="admin-modal-overlay"
            onClick={() => setShowClinicList(false)}
          >
            <dialog
              className="popup-dialog"
              open
              onClick={(event) => event.stopPropagation()}
            >
              <form className="popup-form">
                <header className="popup-header">
                  <h2>Clinics</h2>
                </header>

                <input
                  className="popup-input"
                  type="text"
                  placeholder="Search clinics..."
                  value={clinicSearch}
                  onChange={async (event) => {
                    const value = event.target.value;
                    setClinicSearch(value);

                    const searchTerm = value.trim();

                    if (searchTerm.length >= 1) {
                      setLoadingClinics(true);

                      const { data: startsWithData } = await supabaseClient
                        .from("clinics")
                        .select("facility_name, admin1, facility_type")
                        .ilike("facility_name", `${searchTerm}%`)
                        .limit(20);

                      const { data: containsData } = await supabaseClient
                        .from("clinics")
                        .select("facility_name, admin1, facility_type")
                        .ilike("facility_name", `%${searchTerm}%`)
                        .limit(50);

                      const allClinics = [
                        ...(startsWithData || []),
                        ...(containsData || []),
                      ];

                      const uniqueClinics = allClinics.filter(
                        (clinic, index, self) =>
                          index ===
                          self.findIndex(
                            (c) => c.facility_name === clinic.facility_name
                          )
                      );

                      setClinicList(uniqueClinics);
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
                      .filter((clinic) =>
                        clinic.facility_name
                          ?.toLowerCase()
                          .includes(clinicSearch.toLowerCase())
                      )
                      .map((clinic, index) => (
                        <li key={index}>
                          {clinic.facility_name} — {clinic.admin1} —{" "}
                          {clinic.facility_type}
                        </li>
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
          </section>
        )}

        {staffToRemove && (
          <section
            className="admin-modal-overlay"
            onClick={() => setStaffToRemove(null)}
          >
            <dialog
              className="popup-dialog"
              open
              onClick={(event) => event.stopPropagation()}
            >
              <section className="popup-form">
                <header className="popup-header">
                  <h2>Confirm Removal</h2>
                </header>

                <p>
                  Are you sure you want to remove{" "}
                  <strong>{staffToRemove}</strong>?
                </p>

                <footer className="popup-footer">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setStaffToRemove(null)}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => {
                      removeStaff(staffToRemove);
                      setStaffToRemove(null);
                    }}
                  >
                    Confirm Remove
                  </button>
                </footer>
              </section>
            </dialog>
          </section>
        )}

        {showProfilePopup && (
          <section
            className="admin-modal-overlay"
            onClick={() => setShowProfilePopup(false)}
          >
            <dialog
              className="popup-dialog"
              open
              onClick={(event) => event.stopPropagation()}
            >
              <form className="popup-form" autoComplete="off">
                <header className="popup-header">
                  <h2>Profile Settings</h2>
                </header>

                <input
                  type="text"
                  name="hiddenAdminUsername"
                  autoComplete="username"
                  tabIndex="-1"
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "-9999px",
                    width: "1px",
                    height: "1px",
                    opacity: 0,
                  }}
                />

                <input
                  type="password"
                  name="hiddenAdminPassword"
                  autoComplete="current-password"
                  tabIndex="-1"
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "-9999px",
                    width: "1px",
                    height: "1px",
                    opacity: 0,
                  }}
                />

                <section className="profile-option-card">
                  <h3>Change Username</h3>

                  <label className="popup-label" htmlFor="adminDisplayNameInput">
                    New Username
                  </label>

                  <input
                    className="popup-input"
                    id="adminDisplayNameInput"
                    name="adminDisplayNameInputNoAutoFill"
                    type="text"
                    placeholder="Enter new username"
                    value={newUsername}
                    autoComplete="new-password"
                    spellCheck="false"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    onChange={(event) => setNewUsername(event.target.value)}
                  />

                  {profileError && (
                    <p className="admin-error-message">{profileError}</p>
                  )}

                  <button
                    type="button"
                    className="save-btn"
                    onClick={handleUsernameUpdate}
                    disabled={isSavingUsername}
                  >
                    {isSavingUsername ? "Updating..." : "Update Username"}
                  </button>
                </section>

                <section className="profile-option-card">
                  <h3>Change Password</h3>

                  <label className="popup-label" htmlFor="adminNewPasswordInput">
                    New Password
                  </label>

                  <input
                    className="popup-input"
                    id="adminNewPasswordInput"
                    name="adminNewPasswordInputNoAutofill"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    onChange={(event) => setNewPassword(event.target.value)}
                  />

                  <label
                    className="popup-label"
                    htmlFor="adminConfirmPasswordInput"
                  >
                    Confirm Password
                  </label>

                  <input
                    className="popup-input"
                    id="adminConfirmPasswordInput"
                    name="adminConfirmPasswordInputNoAutofill"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />

                  {passwordError && (
                    <p className="admin-error-message">{passwordError}</p>
                  )}

                  <button
                    type="button"
                    className="save-btn"
                    onClick={handlePasswordUpdate}
                    disabled={isSavingPassword}
                  >
                    {isSavingPassword ? "Updating..." : "Update Password"}
                  </button>
                </section>

                <footer className="popup-footer">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowProfilePopup(false)}
                  >
                    Close
                  </button>
                </footer>
              </form>
            </dialog>
          </section>
        )}
      </section>
    </main>
  );
}

export default AdminDashboard;