import { createClinicStaffInvite } from "../lib/adminService";
import { supabaseClient } from "../lib/supabaseClient";

// ---------------- MOCK SUPABASE ----------------
jest.mock("../lib/supabaseClient", () => ({
  supabaseClient: {
    auth: {
      getSession: jest.fn(),
    },
    functions: {
      invoke: jest.fn(),
    },
  },
}));

describe("createClinicStaffInvite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------- SUCCESS ----------------
  test("creates clinic staff invite successfully", async () => {
    supabaseClient.auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "token123",
        },
      },
    });

    supabaseClient.functions.invoke.mockResolvedValue({
      data: { success: true, email: "staff@example.com" },
      error: null,
    });

    const result = await createClinicStaffInvite({
      email: " Staff@Example.com ",
      clinicId: "clinic-1",
    });

    expect(supabaseClient.functions.invoke).toHaveBeenCalledWith(
      "create-clinic-staff",
      {
        body: {
          email: "staff@example.com",
          clinicId: "clinic-1",
        },
        headers: {
          Authorization: "Bearer token123",
        },
      }
    );

    expect(result).toEqual({
      success: true,
      email: "staff@example.com",
    });
  });

  // ---------------- FUNCTION ERROR ----------------
  test("throws error when supabase function returns error", async () => {
    supabaseClient.auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "token123",
        },
      },
    });

    supabaseClient.functions.invoke.mockResolvedValue({
      data: null,
      error: new Error("Function failed"),
    });

    await expect(
      createClinicStaffInvite({
        email: "test@example.com",
        clinicId: "clinic-1",
      })
    ).rejects.toThrow("Function failed");
  });

  // ---------------- BUSINESS ERROR RESPONSE ----------------
  test("throws error when function returns success: false", async () => {
    supabaseClient.auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "token123",
        },
      },
    });

    supabaseClient.functions.invoke.mockResolvedValue({
      data: {
        success: false,
        error: "Clinic not found",
      },
      error: null,
    });

    await expect(
      createClinicStaffInvite({
        email: "test@example.com",
        clinicId: "clinic-1",
      })
    ).rejects.toThrow("Clinic not found");
  });

  // ---------------- DEFAULT ERROR MESSAGE ----------------
  test("throws default error when no error message provided", async () => {
    supabaseClient.auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "token123",
        },
      },
    });

    supabaseClient.functions.invoke.mockResolvedValue({
      data: { success: false },
      error: null,
    });

    await expect(
      createClinicStaffInvite({
        email: "test@example.com",
        clinicId: "clinic-1",
      })
    ).rejects.toThrow("Failed to create clinic staff invite.");
  });
});