import { supabaseClient } from "../lib/supabaseClient";

export const QUEUE_OPEN_TIME = "08:00";
export const QUEUE_CLOSE_TIME = "17:00";
export const AVERAGE_CONSULTATION_MINUTES = 15;

export function normalizeClinicTime(timeValue, fallback) {
  if (!timeValue) return fallback;
  return String(timeValue).slice(0, 5);
}

export function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

export function isQueueOpenNow(openTime = QUEUE_OPEN_TIME, closeTime = QUEUE_CLOSE_TIME) {
  const now = new Date();

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const safeOpenTime = normalizeClinicTime(openTime, QUEUE_OPEN_TIME);
  const safeCloseTime = normalizeClinicTime(closeTime, QUEUE_CLOSE_TIME);

  const [openHour, openMinute] = safeOpenTime.split(":").map(Number);
  const [closeHour, closeMinute] = safeCloseTime.split(":").map(Number);

  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

export function calculateEstimatedWait(position) {
  if (!position || position <= 1) return 0;
  return (position - 1) * AVERAGE_CONSULTATION_MINUTES;
}

export async function getTodayQueueForClinic(clinicId) {
  const today = getTodayDateString();

  const { data, error } = await supabaseClient
    .from("queue_entries")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("queue_date", today)
    .in("status", ["waiting", "in_consultation"])
    .order("joined_at", { ascending: true });

  if (error) throw error;

  return data || [];
}

export async function getMyQueueEntryForClinic(clinicId) {
  const today = getTodayDateString();

  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in to use the queue.");

  const { data, error } = await supabaseClient
    .from("queue_entries")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("patient_id", user.id)
    .eq("queue_date", today)
    .in("status", ["waiting", "in_consultation"])
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function getMyActiveQueueStatusForToday() {
  const today = getTodayDateString();

  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in to use the queue.");

  const { data: entry, error: entryError } = await supabaseClient
    .from("queue_entries")
    .select("*")
    .eq("patient_id", user.id)
    .eq("queue_date", today)
    .in("status", ["waiting", "in_consultation"])
    .maybeSingle();

  if (entryError) throw entryError;
  if (!entry) return null;

  const { data: clinic, error: clinicError } = await supabaseClient
    .from("clinics")
    .select("*")
    .eq("id", entry.clinic_id)
    .single();

  if (clinicError) throw clinicError;

  const queue = await getTodayQueueForClinic(entry.clinic_id);
  const position = queue.findIndex((item) => item.id === entry.id) + 1;

  return {
    entry,
    clinic,
    position,
    estimatedWait: calculateEstimatedWait(position),
  };
}

export async function joinQueue(clinicId) {
  const { data: clinic, error: clinicError } = await supabaseClient
    .from("clinics")
    .select("id, open_t, closed_t")
    .eq("id", clinicId)
    .single();

  if (clinicError) throw clinicError;

  if (!isQueueOpenNow(clinic?.open_t, clinic?.closed_t)) {
    throw new Error(
      `The queue is currently closed. Queue hours are ${normalizeClinicTime(
        clinic?.open_t,
        QUEUE_OPEN_TIME
      )} to ${normalizeClinicTime(clinic?.closed_t, QUEUE_CLOSE_TIME)}.`
    );
  }

  const today = getTodayDateString();

  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in to join the queue.");

  const activeQueueStatus = await getMyActiveQueueStatusForToday();

  if (activeQueueStatus) {
    throw new Error("ALREADY_IN_QUEUE");
  }

  const { data, error } = await supabaseClient
    .from("queue_entries")
    .insert({
      clinic_id: clinicId,
      patient_id: user.id,
      queue_date: today,
      status: "waiting",
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function leaveQueue(queueEntryId) {
  const { data, error } = await supabaseClient
    .from("queue_entries")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", queueEntryId)
    .select()
    .single();

  if (error) throw error;

  return data;
}