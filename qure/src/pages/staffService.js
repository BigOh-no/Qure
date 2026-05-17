import { supabaseClient } from "../lib/supabaseClient";
import { getTodayQueueForClinic } from "./queueService";

const DEFAULT_OPEN_TIME = "08:00";
const DEFAULT_CLOSE_TIME = "17:00";

function normalizeClinicTime(timeValue, fallback) {
  if (!timeValue) return fallback;
  return String(timeValue).slice(0, 5);
}

function timeToMinutes(timeValue) {
  const [hours, minutes] = normalizeClinicTime(timeValue, "00:00")
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
}

function isTimeWithinClinicHours(timeValue, openTime, closeTime) {
  const timeMinutes = timeToMinutes(timeValue);
  const openMinutes = timeToMinutes(normalizeClinicTime(openTime, DEFAULT_OPEN_TIME));
  const closeMinutes = timeToMinutes(
    normalizeClinicTime(closeTime, DEFAULT_CLOSE_TIME)
  );

  return timeMinutes >= openMinutes && timeMinutes <= closeMinutes;
}

async function getLoggedInStaffClinicId() {
  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("No logged-in user found");

  const { data: staff, error: staffError } = await supabaseClient
    .from("clinicStaff")
    .select("clinic_id")
    .eq("staff_id", user.id)
    .single();

  if (staffError) throw staffError;
  if (!staff) throw new Error("No staff clinic found");

  return staff.clinic_id;
}

async function getLoggedInStaffClinic() {
  const clinicId = await getLoggedInStaffClinicId();

  const { data: clinic, error } = await supabaseClient
    .from("clinics")
    .select("id, facility_name, open_t, closed_t")
    .eq("id", clinicId)
    .single();

  if (error) throw error;

  return clinic;
}

async function validateAppointmentTimeForStaffClinic(appointmentTime) {
  const clinic = await getLoggedInStaffClinic();

  if (
    !isTimeWithinClinicHours(
      appointmentTime,
      clinic.open_t,
      clinic.closed_t
    )
  ) {
    throw new Error(
      `Appointment time must be between ${normalizeClinicTime(
        clinic.open_t,
        DEFAULT_OPEN_TIME
      )} and ${normalizeClinicTime(clinic.closed_t, DEFAULT_CLOSE_TIME)}.`
    );
  }

  return clinic;
}

async function getProfilesByIds(userIds) {
  if (!userIds || userIds.length === 0) {
    return {};
  }

  const uniqueUserIds = [...new Set(userIds)];

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, email, role")
    .in("id", uniqueUserIds);

  if (error) throw error;

  const profileMap = {};

  data.forEach((profile) => {
    profileMap[profile.id] = profile;
  });

  return profileMap;
}

async function getPatientProfileByEmail(email) {
  const cleanedEmail = email.trim().toLowerCase();

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, email, role")
    .eq("email", cleanedEmail)
    .eq("role", "patient")
    .single();

  if (error) throw error;

  return data;
}

export async function getStaffClinicAndQueue() {
  try {
    const clinic = await getLoggedInStaffClinic();

    const queue = await getTodayQueueForClinic(clinic.id);

    const patientIds = queue.map((entry) => entry.patient_id);
    const profileMap = await getProfilesByIds(patientIds);

    const queueWithPatients = queue.map((entry) => {
      const profile = profileMap[entry.patient_id];

      return {
        ...entry,
        patient_name:
          profile?.full_name || profile?.email || "Unknown Patient",
      };
    });

    return {
      clinicId: clinic.id,
      clinicName: clinic.facility_name,
      open_t: clinic.open_t,
      closed_t: clinic.closed_t,
      patients: queueWithPatients,
    };
  } catch (error) {
    console.error(error);

    return {
      clinicId: null,
      clinicName: "",
      open_t: null,
      closed_t: null,
      patients: [],
    };
  }
}

export async function updateQueueStatus(id, newStatus) {
  try {
    const currentTime = new Date().toISOString();

    if (newStatus === "in_consultation") {
      const { error } = await supabaseClient
        .from("queue_entries")
        .update({
          status: newStatus,
          started_at: currentTime,
        })
        .eq("id", id);

      if (error) throw error;
    } else if (newStatus === "completed") {
      const { error } = await supabaseClient
        .from("queue_entries")
        .update({
          status: newStatus,
          completed_at: currentTime,
        })
        .eq("id", id);

      if (error) throw error;
    } else {
      console.error("Invalid Status");
      return false;
    }

    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

export async function getClinicAppointments() {
  try {
    const clinicId = await getLoggedInStaffClinicId();

    const { data: appointments, error } = await supabaseClient
      .from("appointments")
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        patient_user_id,
        clinic_id,
        created_at
      `)
      .eq("clinic_id", clinicId)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (error) throw error;

    const patientIds = appointments.map(
      (appointment) => appointment.patient_user_id
    );

    const profileMap = await getProfilesByIds(patientIds);

    const appointmentsWithEmails = appointments.map((appointment) => {
      const profile = profileMap[appointment.patient_user_id];

      return {
        ...appointment,
        patient_email: profile?.email || "Email not found",
      };
    });

    return appointmentsWithEmails || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function staffCreateAppointment({
  patientEmail,
  appointmentDate,
  appointmentTime,
}) {
  try {
    const clinic = await validateAppointmentTimeForStaffClinic(appointmentTime);
    const patientProfile = await getPatientProfileByEmail(patientEmail);

    const { data: existingAppointment, error: existingError } =
      await supabaseClient
        .from("appointments")
        .select("id, status")
        .eq("clinic_id", clinic.id)
        .eq("appointment_date", appointmentDate)
        .eq("appointment_time", appointmentTime)
        .in("status", ["booked", "checked_in"])
        .maybeSingle();

    if (existingError) throw existingError;

    if (existingAppointment) {
      throw new Error(
        "This appointment slot is already booked or checked in."
      );
    }

    const { data, error } = await supabaseClient
      .from("appointments")
      .insert([
        {
          patient_user_id: patientProfile.id,
          clinic_id: clinic.id,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          status: "booked",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      patient_email: patientProfile.email,
    };
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function staffCheckInAppointment(appointmentId) {
  try {
    const clinicId = await getLoggedInStaffClinicId();

    const { data, error } = await supabaseClient
      .from("appointments")
      .update({ status: "checked_in" })
      .eq("id", appointmentId)
      .eq("clinic_id", clinicId)
      .select()
      .single();

    if (error) {
      console.error("Check-in error:", error.message);
      throw error;
    }

    const profileMap = await getProfilesByIds([data.patient_user_id]);
    const profile = profileMap[data.patient_user_id];

    return {
      ...data,
      patient_email: profile?.email || "Email not found",
    };
  } catch (err) {
    console.error("Could not check in appointment:", err);
    throw err;
  }
}

export async function staffCancelAppointment(appointmentId) {
  try {
    const clinicId = await getLoggedInStaffClinicId();

    const { data, error } = await supabaseClient
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointmentId)
      .eq("clinic_id", clinicId)
      .select()
      .single();

    if (error) throw error;

    const profileMap = await getProfilesByIds([data.patient_user_id]);
    const profile = profileMap[data.patient_user_id];

    return {
      ...data,
      patient_email: profile?.email || "Email not found",
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function staffRescheduleAppointment({
  appointmentId,
  appointmentDate,
  appointmentTime,
}) {
  try {
    const clinic = await validateAppointmentTimeForStaffClinic(appointmentTime);

    const { data, error } = await supabaseClient
      .from("appointments")
      .update({
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        status: "booked",
      })
      .eq("id", appointmentId)
      .eq("clinic_id", clinic.id)
      .select()
      .single();

    if (error) throw error;

    const profileMap = await getProfilesByIds([data.patient_user_id]);
    const profile = profileMap[data.patient_user_id];

    return {
      ...data,
      patient_email: profile?.email || "Email not found",
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function getPatientsForStaffClinic() {
  try {
    const clinicId = await getLoggedInStaffClinicId();

    const { data: appointments, error } = await supabaseClient
      .from("appointments")
      .select(`
        patient_user_id,
        appointment_date,
        appointment_time,
        status,
        created_at
      `)
      .eq("clinic_id", clinicId)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });

    if (error) throw error;

    const patientIds = appointments.map(
      (appointment) => appointment.patient_user_id
    );

    const profileMap = await getProfilesByIds(patientIds);

    const patientMap = new Map();

    appointments.forEach((appointment) => {
      const patientId = appointment.patient_user_id;
      const profile = profileMap[patientId];

      if (!patientMap.has(patientId)) {
        patientMap.set(patientId, {
          patient_user_id: patientId,
          patient_email: profile?.email || "Email not found",
          totalAppointments: 1,
          latestAppointmentDate: appointment.appointment_date,
          latestAppointmentTime: appointment.appointment_time,
          latestStatus: appointment.status,
        });
      } else {
        const existingPatient = patientMap.get(patientId);

        patientMap.set(patientId, {
          ...existingPatient,
          totalAppointments: existingPatient.totalAppointments + 1,
        });
      }
    });

    return Array.from(patientMap.values());
  } catch (err) {
    console.error(err);
    return [];
  }
}