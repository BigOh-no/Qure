import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";

import PatientDashboard from "../pages/Patient-dashboard";
import { useNavigate } from "react-router-dom";
import { supabaseClient } from "../lib/supabaseClient";

import {
  getPatientAppointments,
  cancelAppointment,
  rescheduleAppointment,
  getBookedSlots,
  generateHourlySlots,
} from "../pages/appointmentService";

import {
  getMyActiveQueueStatusForToday,
  getTodayQueueForClinic,
  calculateEstimatedWait,
} from "../pages/queueService";

/* ---------------- mocks ---------------- */

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

jest.mock("../lib/supabaseClient", () => ({
  supabaseClient: {
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })),
    })),
  },
}));

jest.mock("../pages/appointmentService", () => ({
  getPatientAppointments: jest.fn(),
  cancelAppointment: jest.fn(),
  rescheduleAppointment: jest.fn(),
  getBookedSlots: jest.fn(),
  generateHourlySlots: jest.fn(),
}));

jest.mock("../pages/queueService", () => ({
  QUEUE_OPEN_TIME: "08:00",
  QUEUE_CLOSE_TIME: "17:00",
  AVERAGE_CONSULTATION_MINUTES: 15,
  calculateEstimatedWait: jest.fn(() => 30),
  getMyActiveQueueStatusForToday: jest.fn(),
  getTodayQueueForClinic: jest.fn(),
}));

/* ---------------- setup ---------------- */

const mockNavigate = jest.fn();

const mockAppointment = {
  id: "appt-1",
  clinic_id: "clinic-1",
  appointment_date: "2099-01-01",
  appointment_time: "10:00:00",
  status: "booked",
  clinics: { facility_name: "Test Clinic" },
};

const mockQueueEntry = {
  id: "queue-1",
  clinic_id: "clinic-1",
  status: "waiting",
};

beforeEach(() => {
  jest.clearAllMocks();
  useNavigate.mockReturnValue(mockNavigate);

  supabaseClient.auth.getUser.mockResolvedValue({
    data: {
      user: {
        email: "john@test.com",
        user_metadata: { full_name: "John Doe" },
      },
    },
    error: null,
  });

  getPatientAppointments.mockResolvedValue([mockAppointment]);

  getMyActiveQueueStatusForToday.mockResolvedValue({
    entry: mockQueueEntry,
    position: 1,
    estimatedWait: 30,
  });

  getTodayQueueForClinic.mockResolvedValue([mockQueueEntry]);

  generateHourlySlots.mockReturnValue(["10:00", "11:00"]);
  getBookedSlots.mockResolvedValue([]);
});

/* ---------------- tests ---------------- */

test("renders dashboard with user, appointments, and queue", async () => {
  render(<PatientDashboard />);

  expect(await screen.findByText(/Hi, John Doe/i)).toBeInTheDocument();
  expect(await screen.findByText(/Test Clinic/i)).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /Current Queue/i })).toBeInTheDocument();
});

test("cancels appointment successfully", async () => {
  cancelAppointment.mockResolvedValueOnce({});

  render(<PatientDashboard />);

  const cancelBtn = await screen.findByRole("button", { name: /cancel/i });
  fireEvent.click(cancelBtn);

  expect(
    await screen.findByText(/Cancel Appointment/i)
  ).toBeInTheDocument();

  fireEvent.click(
    await screen.findByRole("button", { name: /confirm cancel/i })
  );

  await waitFor(() => {
    expect(cancelAppointment).toHaveBeenCalledWith("appt-1");
  });

  expect(
    await screen.findByText(/Appointment cancelled successfully/i)
  ).toBeInTheDocument();
});

test("logs out user", async () => {
  supabaseClient.auth.signOut.mockResolvedValueOnce({});

  render(<PatientDashboard />);

  fireEvent.click(await screen.findByText(/logout/i));

  await waitFor(() => {
    expect(supabaseClient.auth.signOut).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});

test("leaves queue successfully", async () => {
  render(<PatientDashboard />);

  const leaveBtn = await screen.findByRole("button", {
    name: /leave queue/i,
  });

  fireEvent.click(leaveBtn);


  await waitFor(() => {
    expect(supabaseClient.from).toHaveBeenCalledWith("queue_entries");
  });

  expect(
    screen.queryByRole("button", { name: /leave queue/i })
  ).not.toBeInTheDocument();
});

test("reschedules appointment successfully", async () => {
  rescheduleAppointment.mockResolvedValueOnce({});

  render(<PatientDashboard />);

  // open modal
  fireEvent.click(
    await screen.findByRole("button", { name: /reschedule/i })
  );

  expect(
    await screen.findByText(/reschedule appointment/i)
  ).toBeInTheDocument();

  // change date (triggers async slot loading)
  const dateInput = await screen.findByLabelText(/choose a new date/i);

  fireEvent.change(dateInput, {
    target: { value: "2099-01-02" },
  });

  // wait for slot to appear (CRITICAL FIX)
  const slotBtn = await screen.findByRole("button", {
    name: "10:00",
  });

  fireEvent.click(slotBtn);

  // confirm
  fireEvent.click(
    await screen.findByRole("button", { name: /confirm/i })
  );

  await waitFor(() => {
    expect(rescheduleAppointment).toHaveBeenCalled();
  });

  expect(
    await screen.findByText(/Appointment rescheduled successfully/i)
  ).toBeInTheDocument();
});

test("shows error when appointment load fails", async () => {
  getPatientAppointments.mockRejectedValueOnce(new Error("fail"));

  render(<PatientDashboard />);

  expect(
    await screen.findByText(/Failed to load your appointments/i)
  ).toBeInTheDocument();
});