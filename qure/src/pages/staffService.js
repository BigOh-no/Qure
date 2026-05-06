import { supabaseClient } from "../lib/supabaseClient";
import { getTodayQueueForClinic } from "./queueService";

/*
  Helper function:
  Gets the logged-in staff member's clinic_id from the clinicStaff table.
*/
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

/*
  Helper function:
  Gets emails from profiles using a list of user ids.
  This is used because there is no foreign key relationship.
*/
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

/*
  Helper function:
  Gets a patient profile by email.
  Used when staff creates an appointment using the patient's email.
*/
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
    const clinicId = await getLoggedInStaffClinicId();

    const { data: clinic, error: clinicError } = await supabaseClient
      .from("clinics")
      .select("facility_name")
      .eq("id", clinicId)
      .single();

    if (clinicError) throw clinicError;

    const queue = await getTodayQueueForClinic(clinicId);

    return {
      clinicName: clinic.facility_name,
      patients: queue,
    };
  } catch (error) {
    console.error(error);

    return {
      clinicName: "",
      patients: [],
    };
  }
}

export async function updateQueueStatus(id, newStatus) {
  try {
    const { error } = await supabaseClient
      .from("queue_entries")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) throw error;

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
    const clinicId = await getLoggedInStaffClinicId();
    const patientProfile = await getPatientProfileByEmail(patientEmail);

    const { data, error } = await supabaseClient
      .from("appointments")
      .insert([
        {
          patient_user_id: patientProfile.id,
          clinic_id: clinicId,
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
    return null;
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
    const clinicId = await getLoggedInStaffClinicId();

    const { data, error } = await supabaseClient
      .from("appointments")
      .update({
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        status: "booked",
      })
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

/*
  Gets all unique patients for the staff member's clinic
  by using appointments, then manually referencing profiles.
*/
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