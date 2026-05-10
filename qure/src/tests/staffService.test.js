
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
                    facility_name: "Test Clinic",
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
            insert: () => ({
              select: () => ({
                single: async () => ({
                  data: {
                    id: 1,
                    status: "booked",
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
  });
});

