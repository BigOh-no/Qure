import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PatientDashboard from "../pages/Patient-dashboard"
import { MemoryRouter } from "react-router-dom";
import { supabaseClient } from "../lib/supabaseClient";
import {
  getPatientAppointments,
  cancelAppointment,
  rescheduleAppointment,
} from "../pages/appointmentService";

// ---------------- MOCKS ----------------
jest.mock("../lib/supabaseClient", () => ({
  supabaseClient: {
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

jest.mock("../pages/appointmentService", () => ({
  getPatientAppointments: jest.fn(),
  cancelAppointment: jest.fn(),
  rescheduleAppointment: jest.fn(),
  getBookedSlots: jest.fn().mockResolvedValue([]),
  generateHourlySlots: jest.fn(() => ["09:00", "10:00"]),
}));

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// ---------------- TESTS ----------------
describe("PatientDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    supabaseClient.auth.getUser.mockResolvedValue({
      data: {
        user: {
          email: "test@example.com",
          user_metadata: { full_name: "John Doe" },
        },
      },
      error: null,
    });

    getPatientAppointments.mockResolvedValue([
      {
        id: 1,
        clinic_id: "clinic-1",
        appointment_date: "2026-04-20",
        appointment_time: "09:00:00",
        status: "booked",
        clinics: { facility_name: "Clinic A" },
      },
    ]);
  });

  test("renders patient name and appointments", async () => {
    render(
      <MemoryRouter>
        <PatientDashboard />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Hi, John Doe/i)).toBeInTheDocument();
    expect(await screen.findByText(/Clinic A/i)).toBeInTheDocument();
  });

  test("cancels appointment", async () => {
    window.confirm = jest.fn(() => true);

    cancelAppointment.mockResolvedValue({});

    render(
      <MemoryRouter>
        <PatientDashboard />
      </MemoryRouter>
    );

    const cancelBtn = await screen.findByText(/cancel/i);
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(cancelAppointment).toHaveBeenCalledWith(1);
    });
  });

  test("opens reschedule modal", async () => {
    render(
      <MemoryRouter>
        <PatientDashboard />
      </MemoryRouter>
    );

    const rescheduleBtn = await screen.findByText(/reschedule/i);
    fireEvent.click(rescheduleBtn);

    expect(
      await screen.findByText(/reschedule appointment/i)
    ).toBeInTheDocument();
  });

  test("logs out user", async () => {
    supabaseClient.auth.signOut.mockResolvedValue({});

    render(
      <MemoryRouter>
        <PatientDashboard />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByText(/logout/i));

    await waitFor(() => {
      expect(supabaseClient.auth.signOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  test("shows empty state when no appointments", async () => {
    getPatientAppointments.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <PatientDashboard />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/no current appointments/i)
    ).toBeInTheDocument();
  });
});