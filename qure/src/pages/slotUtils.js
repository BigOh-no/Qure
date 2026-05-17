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