import { supabaseClient } from "./supabaseClient";

export async function createClinicStaffInvite({ email, clinicId }) {
  const cleanEmail = email.trim().toLowerCase();

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  const { data, error } = await supabaseClient.functions.invoke(
    "create-clinic-staff",
    {
      body: {
        email: cleanEmail,
        clinicId,
      },
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
    }
  );

  console.log("FUNCTION DATA:", data);
  console.log("FUNCTION ERROR:", error);

  if (error) {
    throw error;
  }

  if (!data?.success) {
    throw new Error(data?.error || "Failed to create clinic staff invite.");
  }

  return data;
}