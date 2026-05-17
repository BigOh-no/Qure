import { supabaseClient } from "../lib/supabaseClient";

export const DEFAULT_OPEN_TIME = "08:00";
export const DEFAULT_CLOSE_TIME = "17:00";

export function normalizeClinicTime(timeValue, fallback) {
  if (!timeValue) return fallback;
  return String(timeValue).slice(0, 5);
}

export function timeToMinutes(timeValue) {
  const [hours, minutes] = normalizeClinicTime(timeValue, "00:00")
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
}

export function formatClinicHours(openTime, closeTime) {
  return `${normalizeClinicTime(openTime, DEFAULT_OPEN_TIME)} - ${normalizeClinicTime(
    closeTime,
    DEFAULT_CLOSE_TIME
  )}`;
}

export function isSlotWithinClinicHours(slot, openTime, closeTime) {
  const slotMinutes = timeToMinutes(slot);
  const openMinutes = timeToMinutes(normalizeClinicTime(openTime, DEFAULT_OPEN_TIME));
  const closeMinutes = timeToMinutes(
    normalizeClinicTime(closeTime, DEFAULT_CLOSE_TIME)
  );

  return slotMinutes >= openMinutes && slotMinutes <= closeMinutes;
}

export function generateHourlySlots(
  openTime = DEFAULT_OPEN_TIME,
  closeTime = DEFAULT_CLOSE_TIME,
  includeClosedRange = false
) {
  const openMinutes = timeToMinutes(normalizeClinicTime(openTime, DEFAULT_OPEN_TIME));
  const closeMinutes = timeToMinutes(
    normalizeClinicTime(closeTime, DEFAULT_CLOSE_TIME)
  );

  const defaultOpenMinutes = timeToMinutes(DEFAULT_OPEN_TIME);
  const defaultCloseMinutes = timeToMinutes(DEFAULT_CLOSE_TIME);

  const startMinutes = includeClosedRange
    ? Math.min(openMinutes, defaultOpenMinutes)
    : openMinutes;

  const endMinutes = includeClosedRange
    ? Math.max(closeMinutes, defaultCloseMinutes)
    : closeMinutes;

  const slots = [];

  for (let minutes = startMinutes; minutes <= endMinutes; minutes += 60) {
    const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
    const minute = String(minutes % 60).padStart(2, "0");
    slots.push(`${hour}:${minute}`);
  }

  return slots;
}

export async function getBookedSlots(clinicId, appointmentDate) {
  const { data, error } = await supabaseClient
    .from("appointments")
    .select("appointment_time")
    .eq("clinic_id", clinicId)
    .eq("appointment_date", appointmentDate)
    .eq("status", "booked");

  if (error) {
    throw error;
  }

  return (data || []).map((item) => item.appointment_time.slice(0, 5));
}

export async function createAppointment({
  clinicId,
  appointmentDate,
  appointmentTime,
}) {
  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be logged in to book an appointment.");
  }

  const { data, error } = await supabaseClient
    .from("appointments")
    .insert([
      {
        patient_user_id: user.id,
        clinic_id: clinicId,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        status: "booked",
      },
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getPatientAppointments() {
  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be logged in to view appointments.");
  }

  const { data, error } = await supabaseClient
    .from("appointments")
    .select(`
      id,
      appointment_date,
      appointment_time,
      status,
      clinic_id,
      clinics (
        id,
        facility_name,
        admin1,
        facility_type,
        open_t,
        closed_t
      )
    `)
    .eq("patient_user_id", user.id)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true });

  if (error) {
    throw error;
  }

  const now = new Date();

  const futureAppointments = (data || []).filter((appt) => {
    if (!appt.appointment_date || !appt.appointment_time) {
      return false;
    }

    const appointmentDateTime = new Date(
      `${appt.appointment_date}T${appt.appointment_time}`
    );

    return appointmentDateTime >= now && appt.status !== "cancelled";
  });

  return futureAppointments;
}

export async function cancelAppointment(appointmentId) {
  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be logged in to cancel an appointment.");
  }

  const { data, error } = await supabaseClient
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)
    .eq("patient_user_id", user.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function rescheduleAppointment({
  appointmentId,
  clinicId,
  appointmentDate,
  appointmentTime,
}) {
  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be logged in to reschedule an appointment.");
  }

  const { data, error } = await supabaseClient
    .from("appointments")
    .update({
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      status: "booked",
      clinic_id: clinicId,
    })
    .eq("id", appointmentId)
    .eq("patient_user_id", user.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getAllPatientAppointments() {
  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("User not logged in.");
  }

  const { data, error } = await supabaseClient
    .from("appointments")
    .select(
      `
      *,
      clinics (
        facility_name,
        admin1,
        facility_type,
        open_t,
        closed_t
      )
    `
    )
    .eq("patient_user_id", user.id)
    .order("appointment_date", { ascending: false })
    .order("appointment_time", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}