import { supabaseClient } from "../lib/supabaseClient";

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