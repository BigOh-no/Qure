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
});