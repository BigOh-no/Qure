import {
  generateHourlySlots,
  getBookedSlots,
  createAppointment,
  getPatientAppointments,
  cancelAppointment,
  rescheduleAppointment,
} from "../pages/appointmentService";

import { supabaseClient } from "../lib/supabaseClient";

jest.mock("../lib/supabaseClient", () => ({
  supabaseClient: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

// ---------------- SUPABASE MOCK ----------------
const createChain = (finalData, finalError = null) => {
  const chain = {};

  const result = Promise.resolve({
    data: finalData,
    error: finalError,
  });

  chain.select = jest.fn(() => chain);
  chain.insert = jest.fn(() => chain);
  chain.update = jest.fn(() => chain);
  chain.eq = jest.fn(() => chain);
  chain.order = jest.fn(() => chain);

  chain.single = jest.fn(() => result);

  chain.then = (resolve) => result.then(resolve);

  return chain;
};

// ---------------- TESTS ----------------
describe("appointmentService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("generateHourlySlots returns 10 slots", () => {
    expect(generateHourlySlots()).toHaveLength(10);
  });

  test("getBookedSlots returns formatted times", async () => {
    supabaseClient.from.mockReturnValue(
      createChain([{ appointment_time: "10:00:00" }])
    );

    const result = await getBookedSlots("c1", "2026-04-20");

    expect(result).toEqual(["10:00"]);
  });

  test("createAppointment inserts appointment", async () => {
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user1" } },
      error: null,
    });

    supabaseClient.from.mockReturnValue(
      createChain({ id: "appt1", clinic_id: "c1" })
    );

    const result = await createAppointment({
      clinicId: "c1",
      appointmentDate: "2026-04-20",
      appointmentTime: "10:00",
    });

    expect(result).toEqual({
      id: "appt1",
      clinic_id: "c1",
    });
  });

  test("getPatientAppointments filters future appointments", async () => {
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    const isoDate = futureDate.toISOString().split("T")[0];

    supabaseClient.from.mockReturnValue(
      createChain([
        {
          id: "1",
          appointment_date: isoDate,
          appointment_time: "10:00:00",
          status: "booked",
          clinics: {},
        },
      ])
    );

    const result = await getPatientAppointments();

    expect(result.length).toBe(1);
  });

  test("cancelAppointment updates status", async () => {
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });

    supabaseClient.from.mockReturnValue(
      createChain({ id: "1", status: "cancelled" })
    );

    const result = await cancelAppointment("1");

    expect(result.status).toBe("cancelled");
  });

  test("rescheduleAppointment updates appointment", async () => {
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });

    supabaseClient.from.mockReturnValue(
      createChain({
        appointment_date: "2026-04-21",
        appointment_time: "11:00",
      })
    );

    const result = await rescheduleAppointment({
      appointmentId: "1",
      clinicId: "c1",
      appointmentDate: "2026-04-21",
      appointmentTime: "11:00",
    });

    expect(result.appointment_date).toBe("2026-04-21");
  });
  test("getBookedSlots throws error when supabase returns error", async () => {
    supabaseClient.from.mockReturnValue(
      createChain(null, new Error("DB error"))
    );

    await expect(
      getBookedSlots("c1", "2026-04-20")
    ).rejects.toThrow("DB error");
  });

  test("createAppointment throws when user is not logged in", async () => {
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(
      createAppointment({
        clinicId: "c1",
        appointmentDate: "2026-04-20",
        appointmentTime: "10:00",
      })
    ).rejects.toThrow("You must be logged in to book an appointment.");
  });

  test("createAppointment throws when auth error occurs", async () => {
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Auth failed"),
    });

    await expect(
      createAppointment({
        clinicId: "c1",
        appointmentDate: "2026-04-20",
        appointmentTime: "10:00",
      })
    ).rejects.toThrow("Auth failed");
  });

  test("getPatientAppointments throws when user not logged in", async () => {
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(getPatientAppointments()).rejects.toThrow(
      "You must be logged in to view appointments."
    );
  });

  test("getPatientAppointments throws on auth error", async () => {
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Auth broken"),
    });

    await expect(getPatientAppointments()).rejects.toThrow("Auth broken");
  });

  test("getPatientAppointments filters out cancelled appointments", async () => {
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    const isoDate = futureDate.toISOString().split("T")[0];

    supabaseClient.from.mockReturnValue(
      createChain([
        {
          id: "1",
          appointment_date: isoDate,
          appointment_time: "10:00:00",
          status: "cancelled",
          clinics: {},
        },
      ])
    );

    const result = await getPatientAppointments();

    expect(result).toEqual([]);
  });

  test("cancelAppointment throws when user not logged in", async () => {
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(cancelAppointment("1")).rejects.toThrow(
      "You must be logged in to cancel an appointment."
    );
  });

  test("cancelAppointment throws on auth error", async () => {
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Auth failed"),
    });

    await expect(cancelAppointment("1")).rejects.toThrow("Auth failed");
  });

  test("rescheduleAppointment throws when user not logged in", async () => {
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(
      rescheduleAppointment({
        appointmentId: "1",
        clinicId: "c1",
        appointmentDate: "2026-04-21",
        appointmentTime: "11:00",
      })
    ).rejects.toThrow("You must be logged in to reschedule an appointment.");
  });

  test("rescheduleAppointment throws on auth error", async () => {
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Auth failed"),
    });

    await expect(
      rescheduleAppointment({
        appointmentId: "1",
        clinicId: "c1",
        appointmentDate: "2026-04-21",
        appointmentTime: "11:00",
      })
    ).rejects.toThrow("Auth failed");
  });
  test("generateHourlySlots respects custom open/close time range", () => {
    const slots = generateHourlySlots("08:00", "10:00");

    // 08:00, 09:00, 10:00
    expect(slots).toEqual(["08:00", "09:00", "10:00"]);
  });

  test("generateHourlySlots with includeClosedRange expands full default range", () => {
    const slots = generateHourlySlots("09:00", "10:00", true);

    // ensures includeClosedRange path is executed
    expect(slots).toContain("09:00");
    expect(slots).toContain("10:00");
  });

  test("getBookedSlots returns empty array when no data", async () => {
    supabaseClient.from.mockReturnValue(
      createChain([])
    );

    const result = await getBookedSlots("c1", "2026-04-20");

    expect(result).toEqual([]);
  });

  test("getPatientAppointments returns empty array when no data", async () => {
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });

    supabaseClient.from.mockReturnValue(
      createChain([])
    );

    const result = await getPatientAppointments();

    expect(result).toEqual([]);
  });

  test("getPatientAppointments filters out past appointments", async () => {
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);

    const isoDate = pastDate.toISOString().split("T")[0];

    supabaseClient.from.mockReturnValue(
      createChain([
        {
          id: "1",
          appointment_date: isoDate,
          appointment_time: "10:00:00",
          status: "booked",
          clinics: {},
        },
      ])
    );

    const result = await getPatientAppointments();

    expect(result).toEqual([]);
  });

  test("getPatientAppointments filters out invalid appointments missing date/time", async () => {
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });

    supabaseClient.from.mockReturnValue(
      createChain([
        {
          id: "1",
          appointment_date: null,
          appointment_time: null,
          status: "booked",
          clinics: {},
        },
      ])
    );

    const result = await getPatientAppointments();

    expect(result).toEqual([]);
  });

  test("cancelAppointment returns error when supabase update fails", async () => {
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });

    supabaseClient.from.mockReturnValue(
      createChain(null, new Error("Update failed"))
    );

    await expect(cancelAppointment("1")).rejects.toThrow("Update failed");
  });

  test("rescheduleAppointment returns error when supabase update fails", async () => {
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });

    supabaseClient.from.mockReturnValue(
      createChain(null, new Error("Update failed"))
    );

    await expect(
      rescheduleAppointment({
        appointmentId: "1",
        clinicId: "c1",
        appointmentDate: "2026-04-21",
        appointmentTime: "11:00",
      })
    ).rejects.toThrow("Update failed");
  });
});