
import {
  getStaffClinicAndQueue,
  updateQueueStatus,
  getClinicAppointments,
  staffCreateAppointment,
  staffCancelAppointment,
  staffRescheduleAppointment,
  getPatientsForStaffClinic,
} from "../pages/staffService";

import { supabaseClient } from "../lib/supabaseClient";
import { getTodayQueueForClinic } from "../pages/queueService";

jest.mock("../lib/supabaseClient", () => ({
  supabaseClient: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

jest.mock("../pages/queueService", () => ({
  getTodayQueueForClinic: jest.fn(),
}));

describe("staffService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /*
    Helper mock for authenticated staff user
  */
  function mockLoggedInUser() {
    supabaseClient.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "staff-1",
        },
      },
      error: null,
    });
  }

  /*
    Mock clinicStaff lookup
  */
  function mockClinicStaff() {
    const single = jest.fn().mockResolvedValue({
      data: {
        clinic_id: "clinic-123",
      },
      error: null,
    });

    const eq = jest.fn(() => ({
      single,
    }));

    const select = jest.fn(() => ({
      eq,
    }));

    supabaseClient.from.mockImplementation((table) => {
      if (table === "clinicStaff") {
        return {
          select,
        };
      }

      return {};
    });
  }

  describe("getStaffClinicAndQueue", () => {
    it("should return clinic name and queue patients", async () => {
      mockLoggedInUser();

      getTodayQueueForClinic.mockResolvedValue([
        {
          id: 1,
          patient_id: "patient-1",
          status: "waiting",
        },
      ]);

      supabaseClient.from.mockImplementation((table) => {
        /*
          clinicStaff
        */
        if (table === "clinicStaff") {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: { clinic_id: "clinic-123" },
                  error: null,
                }),
              }),
            }),
          };
        }

        /*
          clinics
        */
        if (table === "clinics") {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    id: "clinic-123",
                    facility_name: "Test Clinic",
                    open_t: "08:00",
                    closed_t: "17:00",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        /*
          profiles
        */
        if (table === "profiles") {
          return {
            select: () => ({
              in: async () => ({
                data: [
                  {
                    id: "patient-1",
                    email: "patient@test.com",
                    full_name: "John Doe",
                  },
                ],
                error: null,
              }),
            }),
          };
        }

        return {};
      });

      const result = await getStaffClinicAndQueue();

      expect(result.clinicName).toBe("Test Clinic");

      expect(result.patients[0].patient_name).toBe("John Doe");
    });
  });

  describe("updateQueueStatus", () => {
    it("should update queue to in_consultation", async () => {
      const eq = jest.fn().mockResolvedValue({
        error: null,
      });

      const update = jest.fn(() => ({
        eq,
      }));

      supabaseClient.from.mockReturnValue({
        update,
      });

      const result = await updateQueueStatus(
        1,
        "in_consultation"
      );

      expect(result).toBe(true);

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "in_consultation",
          started_at: expect.any(String),
        })
      );
    });

    it("should update queue to completed", async () => {
      const eq = jest.fn().mockResolvedValue({
        error: null,
      });

      const update = jest.fn(() => ({
        eq,
      }));

      supabaseClient.from.mockReturnValue({
        update,
      });

      const result = await updateQueueStatus(
        1,
        "completed"
      );

      expect(result).toBe(true);

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "completed",
          completed_at: expect.any(String),
        })
      );
    });

    it("should return false for invalid status", async () => {
      const result = await updateQueueStatus(
        1,
        "unknown"
      );

      expect(result).toBe(false);
    });
  });

  describe("staffCreateAppointment", () => {
    it("should create appointment successfully", async () => {
      mockLoggedInUser();

      supabaseClient.from.mockImplementation((table) => {
        /*
          clinicStaff
        */
        if (table === "clinicStaff") {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    clinic_id: "clinic-123",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        /*
          clinics
        */
        if (table === "clinics") {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    id: "clinic-123",
                    facility_name: "Test Clinic",
                    open_t: "08:00",
                    closed_t: "17:00",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        /*
          profiles
        */
        if (table === "profiles") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: async () => ({
                    data: {
                      id: "patient-1",
                      email: "patient@test.com",
                      role: "patient",
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        /*
          appointments
        */
        if (table === "appointments") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    in: () => ({
                      maybeSingle: async () => ({
                        data: null,
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),

            insert: () => ({
              select: () => ({
                single: async () => ({
                  data: {
                    id: 1,
                    status: "booked",
                    patient_user_id: "patient-1",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        return {};
      });

      const result = await staffCreateAppointment({
        patientEmail: "patient@test.com",
        appointmentDate: "2026-05-10",
        appointmentTime: "09:00",
      });

      expect(result.patient_email).toBe(
        "patient@test.com"
      );
    });
  });

  describe("getPatientsForStaffClinic", () => {
    it("should return aggregated patients", async () => {
      mockLoggedInUser();

      supabaseClient.from.mockImplementation((table) => {
        /*
          clinicStaff
        */
        if (table === "clinicStaff") {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    clinic_id: "clinic-123",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        /*
          appointments
        */
        if (table === "appointments") {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  order: async () => ({
                    data: [
                      {
                        patient_user_id: "patient-1",
                        appointment_date: "2026-05-10",
                        appointment_time: "09:00",
                        status: "booked",
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        /*
          profiles
        */
        if (table === "profiles") {
          return {
            select: () => ({
              in: async () => ({
                data: [
                  {
                    id: "patient-1",
                    email: "patient@test.com",
                  },
                ],
                error: null,
              }),
            }),
          };
        }

        return {};
      });

      const result = await getPatientsForStaffClinic();

      expect(result.length).toBe(1);

      expect(result[0].patient_email).toBe(
        "patient@test.com"
      );

      expect(result[0].totalAppointments).toBe(1);
    });
    test("getStaffClinicAndQueue returns fallback on error", async () => {
      supabaseClient.auth.getUser.mockRejectedValue(new Error("auth fail"));

      const result = await getStaffClinicAndQueue();

      expect(result).toEqual({
        clinicId: null,
        clinicName: "",
        open_t: null,
        closed_t: null,
        patients: [],
      });
    });
    test("updateQueueStatus returns false on DB error", async () => {
      const eq = jest.fn().mockResolvedValue({ error: new Error("db fail") });

      const update = jest.fn(() => ({ eq }));

      supabaseClient.from.mockReturnValue({ update });

      const result = await updateQueueStatus(1, "in_consultation");

      expect(result).toBe(false);
    });
    test("getClinicAppointments returns empty array on error", async () => {
      supabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "staff-1" } },
        error: null,
      });

      const eq = jest.fn().mockReturnThis();
      const order = jest.fn(() => ({ order: jest.fn().mockRejectedValue(new Error("fail")) }));

      supabaseClient.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            order,
          }),
        }),
      });

      const result = await getClinicAppointments();

      expect(result).toEqual([]);
    });
    test("staffCancelAppointment returns null on error", async () => {
      supabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "staff-1" } },
        error: null,
      });

      supabaseClient.from.mockReturnValue({
        update: () => ({
          eq: () => ({
            eq: () => ({
              select: () => ({
                single: async () => ({
                  error: new Error("db error"),
                }),
              }),
            }),
          }),
        }),
      });

      const result = await staffCancelAppointment(1);

      expect(result).toBeNull();
    });
    test("staffRescheduleAppointment returns null on error", async () => {
      supabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "staff-1" } },
        error: null,
      });

      supabaseClient.from.mockReturnValue({
        update: () => ({
          eq: () => ({
            eq: () => ({
              select: () => ({
                single: async () => ({
                  error: new Error("db error"),
                }),
              }),
            }),
          }),
        }),
      });

      const result = await staffRescheduleAppointment({
        appointmentId: 1,
        appointmentDate: "2026-05-10",
        appointmentTime: "09:00",
      });

      expect(result).toBeNull();
    });
    test("staffCreateAppointment throws when slot already exists", async () => {
      mockLoggedInUser();

      supabaseClient.from.mockImplementation((table) => {
        if (table === "clinicStaff") {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: { clinic_id: "clinic-123" },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === "clinics") {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    id: "clinic-123",
                    open_t: "08:00",
                    closed_t: "17:00",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === "profiles") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: async () => ({
                    data: {
                      id: "patient-1",
                      email: "patient@test.com",
                      role: "patient",
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        if (table === "appointments") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    in: () => ({
                      maybeSingle: async () => ({
                        data: { id: 99 },
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }

        return {};
      });

      await expect(
        staffCreateAppointment({
          patientEmail: "patient@test.com",
          appointmentDate: "2026-05-10",
          appointmentTime: "09:00",
        })
      ).rejects.toThrow("already booked");
    });
  });
});

