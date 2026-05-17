import { supabaseClient } from "../lib/supabaseClient";

/*
  Search clinics with optional filters.

  Rules:
  - clinic name search matches names starting with the typed letters
  - province filter is optional
  - facility type filter is optional
  - at least one of the three filters should be provided by the frontend
*/
export async function searchClinics({
  searchTerm = "",
  admin1 = "",
  facilityType = "",
  limit = 50,
}) {
  let query = supabaseClient
    .from("clinics")
    .select(
      "id, admin1, facility_name, facility_type, ownership, lat, lon, open_t, closed_t"
    )
    .limit(limit);

  if (admin1) {
    query = query.eq("admin1", admin1);
  }

  if (facilityType) {
    query = query.ilike("facility_type", facilityType);
  }

  if (searchTerm.trim()) {
    query = query.ilike("facility_name", `${searchTerm.trim()}%`);
  }

  query = query.order("facility_name", { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error("Error searching clinics:", error);
    throw error;
  }

  return data || [];
}