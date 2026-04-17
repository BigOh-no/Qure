import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PatientDashboard from "../pages/Patient-dashboard";
import { supabaseClient } from "../lib/supabaseClient";
import {
  getPatientAppointments,
  cancelAppointment,
  rescheduleAppointment,
  getBookedSlots,
  generateHourlySlots,
} from "../pages/appointmentService";

// ---------------- MOCK ROUTER ----------------
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ---------------- MOCK SUPABASE ----------------
jest.mock("../lib/supabaseClient", () => ({
  supabaseClient: {
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

// ---------------- MOCK SERVICES ----------------
jest.mock("../pages/appointmentService", () => ({
  getPatientAppointments: jest.fn(),
  cancelAppointment: jest.fn(),
  rescheduleAppointment: jest.fn(),
  getBookedSlots: jest.fn(),
  generateHourlySlots: jest.fn(),
}));

// ---------------- MOCK CONFIRM ----------------
global.confirm = jest.fn();

// ---------------- TEST HELPER ----------------
const renderComponent = () =>
  render(
    <MemoryRouter>
      <PatientDashboard />
    </MemoryRouter>
  );

// ---------------- TESTS ----------------
describe("PatientDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    supabaseClient.auth.getUser.mockResolvedValue({
      data: {
        user: {
          email: "john@example.com",
          user_metadata: { full_name: "John Doe" },
        },
      },
      error: null,
    });

    getPatientAppointments.mockResolvedValue([
      {
        id: "1",
        clinic_id: "c1",
        appointment_date: "2026-04-20",
        appointment_time: "10:00:00",
        status: "booked",
        clinics: { facility_name: "Test Clinic" },
      },
    ]);

    generateHourlySlots.mockReturnValue([
      "09:00",
      "10:00",
      "11:00",
    ]);
  });

  test("renders dashboard greeting", async () => {
    renderComponent();

    expect(await screen.findByText(/hi, john doe/i)).toBeInTheDocument();
  });

  test("renders appointments", async () => {
    renderComponent();

    expect(await screen.findByText(/test clinic/i)).toBeInTheDocument();
    expect(screen.getByText(/2026-04-20/i)).toBeInTheDocument();
    expect(screen.getByText(/booked/i)).toBeInTheDocument();
  });

  test("shows empty state when no appointments", async () => {
    getPatientAppointments.mockResolvedValueOnce([]);

    renderComponent();

    expect(
      await screen.findByText(/no current appointments/i)
    ).toBeInTheDocument();
  });

  test("logout calls supabase and navigates home", async () => {
    supabaseClient.auth.signOut.mockResolvedValueOnce({});

    renderComponent();

    const logoutBtn = await screen.findByRole("button", {
      name: /logout/i,
    });

    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(supabaseClient.auth.signOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  test("navigation buttons work", async () => {
    renderComponent();

    fireEvent.click(
      screen.getByRole("button", { name: /book appointment/i })
    );
    expect(mockNavigate).toHaveBeenCalledWith("/patient/book");

    fireEvent.click(screen.getByRole("button", { name: /join queue/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/patient/queue");

    fireEvent.click(
      screen.getByRole("button", { name: /view all appointments/i })
    );
    expect(mockNavigate).toHaveBeenCalledWith("/patient/appointments");
  });

  test("cancel appointment calls service", async () => {
    global.confirm.mockReturnValueOnce(true);
    cancelAppointment.mockResolvedValueOnce({});

    renderComponent();

    const cancelBtn = await screen.findByRole("button", {
      name: /cancel/i,
    });

    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(cancelAppointment).toHaveBeenCalledWith("1");
    });
  });

  test("does not cancel when user rejects confirm", async () => {
    global.confirm.mockReturnValueOnce(false);

    renderComponent();

    const cancelBtn = await screen.findByRole("button", {
      name: /cancel/i,
    });

    fireEvent.click(cancelBtn);

    expect(cancelAppointment).not.toHaveBeenCalled();
  });
});