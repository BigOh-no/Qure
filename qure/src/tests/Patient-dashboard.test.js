// PatientDashboard.test.jsx

import React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import PatientDashboard from "../pages/Patient-dashboard";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../assets/images/TLogo.png", () => "logo-mock.png");

const mockGetUser = jest.fn();
const mockSignOut = jest.fn();
const mockUpdateUser = jest.fn();
const mockFrom = jest.fn();

jest.mock("../lib/supabaseClient", () => ({
  supabaseClient: {
    auth: {
      getUser: (...args) => mockGetUser(...args),
      signOut: (...args) => mockSignOut(...args),
      updateUser: (...args) => mockUpdateUser(...args),
    },
    from: (...args) => mockFrom(...args),
  },
}));

jest.mock("../pages/appointmentService", () => ({
  getPatientAppointments: jest.fn(),
  cancelAppointment: jest.fn(),
  rescheduleAppointment: jest.fn(),
  getBookedSlots: jest.fn(),
  generateHourlySlots: jest.fn(),
  isSlotWithinClinicHours: jest.fn(() => true),
  formatClinicHours: jest.fn(() => "08:00 - 17:00"),
}));

jest.mock("../pages/queueService", () => ({
  AVERAGE_CONSULTATION_MINUTES: 15,
  calculateEstimatedWait: jest.fn(() => 30),
  getMyActiveQueueStatusForToday: jest.fn(),
  getTodayQueueForClinic: jest.fn(),
}));

import {
  getPatientAppointments,
  cancelAppointment,
  rescheduleAppointment,
  getBookedSlots,
  generateHourlySlots,
  isSlotWithinClinicHours,
  formatClinicHours,
} from "../pages/appointmentService";

import {
  getMyActiveQueueStatusForToday,
  getTodayQueueForClinic,
} from "../pages/queueService";

describe("PatientDashboard", () => {
  const mockAppointment = {
    id: 1,
    clinic_id: 100,
    appointment_date: "2099-12-31",
    appointment_time: "09:00:00",
    status: "booked",
    clinics: {
      facility_name: "Test Clinic",
      open_t: "08:00",
      closed_t: "17:00",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "patient@test.com",
          user_metadata: {
            full_name: "Test Patient",
          },
        },
      },
      error: null,
    });

    mockSignOut.mockResolvedValue({});
    mockUpdateUser.mockResolvedValue({ error: null });

    getPatientAppointments.mockResolvedValue([mockAppointment]);

    getMyActiveQueueStatusForToday.mockResolvedValue(null);

    getTodayQueueForClinic.mockResolvedValue([]);

    getBookedSlots.mockResolvedValue([]);

    generateHourlySlots.mockReturnValue([
      "08:00",
      "09:00",
      "10:00",
    ]);

    isSlotWithinClinicHours.mockReturnValue(true);

    formatClinicHours.mockReturnValue("08:00 - 17:00");

    mockFrom.mockImplementation((table) => {
      if (table === "profiles") {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: {
                  user_name: "PatientUser",
                },
                error: null,
              }),
            })),
          })),
          update: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              error: null,
            }),
          })),
        };
      }

      if (table === "queue_entries") {
        return {
          update: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              error: null,
            }),
          })),
        };
      }

      return {
        select: jest.fn(),
      };
    });
  });

  test("renders patient dashboard", async () => {
    render(<PatientDashboard />);

    expect(
      screen.getByText(/Book Appointment/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText(/Current Appointments/i)
      ).toBeInTheDocument();
    });
  });

  test("loads appointments", async () => {
    render(<PatientDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/Test Clinic/i)
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(/2099-12-31/i)
    ).toBeInTheDocument();
  });

  test("shows empty appointments message", async () => {
    getPatientAppointments.mockResolvedValue([]);

    render(<PatientDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/No current appointments/i)
      ).toBeInTheDocument();
    });
  });

  test("navigates to booking page", async () => {
    render(<PatientDashboard />);

    await userEvent.click(
      screen.getByRole("button", {
        name: /Book Appointment/i,
      })
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      "/patient/book"
    );
  });

  test("navigates to queue page", async () => {
    render(<PatientDashboard />);

    await userEvent.click(
      screen.getByRole("button", {
        name: /Join Queue/i,
      })
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      "/patient/queue"
    );
  });

  test("navigates to appointments page", async () => {
    render(<PatientDashboard />);

    await userEvent.click(
      screen.getByRole("button", {
        name: /View All Appointments/i,
      })
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      "/patient/appointments"
    );
  });

  test("opens cancel modal", async () => {
    render(<PatientDashboard />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: /^Cancel$/i,
        })
      ).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole("button", {
        name: /^Cancel$/i,
      })
    );

    expect(
      screen.getByText(/Cancel Appointment/i)
    ).toBeInTheDocument();
  });

  test("cancels appointment successfully", async () => {
    render(<PatientDashboard />);
    cancelAppointment.mockResolvedValue({});
    getPatientAppointments.mockResolvedValue([
      {
        id: 1,
        appointment_date: "2099-12-31",
        appointment_time: "10:00",
        status: "booked",
        clinics: { facility_name: "Test Clinic" },
      },
    ]);

    fireEvent.click(
      await screen.findByRole("button", { name: /cancel/i })
    );

    fireEvent.click(
      await screen.findByRole("button", { name: /confirm cancel/i })
    );

    expect(
      await screen.findByText(/appointment cancelled successfully/i)
    ).toBeInTheDocument();
  });

  test("opens reschedule modal", async () => {
    render(<PatientDashboard />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: /Reschedule/i,
        })
      ).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole("button", {
        name: /Reschedule/i,
      })
    );

    expect(
      screen.getByText(/Reschedule Appointment/i)
    ).toBeInTheDocument();
  });

  test("shows validation when no slot selected", async () => {
    render(<PatientDashboard />);

    getBookedSlots.mockResolvedValue([]);
    generateHourlySlots.mockReturnValue(["09:00", "10:00"]);

    fireEvent.click(
      await screen.findByRole("button", { name: /reschedule/i })
    );

    fireEvent.change(
      await screen.findByLabelText(/choose a new date/i),
      {
        target: { value: "2099-12-31" },
      }
    );

    await screen.findByText(/choose a time slot/i);

    const confirmBtn = screen.getByRole("button", {
      name: /confirm/i,
    });

    expect(confirmBtn).toBeDisabled(); 

    fireEvent.click(confirmBtn);

    expect(
      screen.queryByText(/appointment rescheduled successfully/i)
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(/please choose a valid available time slot/i)
    ).not.toBeInTheDocument();
  });

  test("reschedules appointment successfully", async () => {
    generateHourlySlots.mockReturnValue([
      "09:00",
      "10:00",
    ]);

    getBookedSlots.mockResolvedValue([]);

    render(<PatientDashboard />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: /reschedule/i,
      })
    );

    const dateInput = await screen.findByLabelText(
      /choose a new date/i
    );

    fireEvent.change(dateInput, {
      target: { value: "2099-12-31" },
    });

    await waitFor(() => {
      expect(screen.getByText("09:00")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: "09:00" })[0]
    );

    fireEvent.click(
      screen.getByRole("button", { name: /^confirm$/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/appointment rescheduled successfully/i)
      ).toBeInTheDocument();
    });

    expect(rescheduleAppointment).toHaveBeenCalled();
  });

  test("opens profile popup", async () => {
    render(<PatientDashboard />);

    fireEvent.click(screen.getByLabelText(/open menu/i));

    fireEvent.click(
      screen.getByRole("button", { name: /edit profile/i })
    );

    expect(screen.getByLabelText(/new username/i)).toBeInTheDocument();
    expect(screen.getByText(/change password/i)).toBeInTheDocument();
  });

  test("shows password mismatch validation", async () => {
    render(<PatientDashboard />);

    await userEvent.click(
      screen.getByLabelText(/Open menu/i)
    );

    await userEvent.click(
      screen.getByRole("button", {
        name: /Edit Profile/i,
      })
    );

    await userEvent.type(
      screen.getByPlaceholderText(/Enter new password/i),
      "password123"
    );

    await userEvent.type(
      screen.getByPlaceholderText(/Confirm new password/i),
      "wrongpassword"
    );

    await userEvent.click(
      screen.getByRole("button", {
        name: /Update Password/i,
      })
    );

    expect(
      screen.getByText(/Passwords do not match/i)
    ).toBeInTheDocument();
  });

  test("shows username validation", async () => {
    render(<PatientDashboard />);

    await userEvent.click(
      screen.getByLabelText(/Open menu/i)
    );

    await userEvent.click(
      screen.getByRole("button", {
        name: /Edit Profile/i,
      })
    );

    const input = screen.getByPlaceholderText(
      /Enter new username/i
    );

    fireEvent.change(input, {
      target: {
        value: "   ",
      },
    });

    await userEvent.click(
      screen.getByRole("button", {
        name: /Update Username/i,
      })
    );

    expect(
      screen.getByText(/Username cannot be empty/i)
    ).toBeInTheDocument();
  });

  test("logs out user", async () => {
    render(<PatientDashboard />);

    await userEvent.click(
      screen.getByLabelText(/Open menu/i)
    );

    await userEvent.click(
      screen.getByRole("button", {
        name: /Logout/i,
      })
    );

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  test("shows queue empty state", async () => {
    render(<PatientDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/You are not in a queue/i)
      ).toBeInTheDocument();
    });
  });

  test("renders active queue information", async () => {
    getMyActiveQueueStatusForToday.mockResolvedValue({
      entry: {
        id: 1,
        clinic_id: 100,
        status: "waiting",
      },
      clinic: {
        facility_name: "Queue Clinic",
        open_t: "08:00",
        closed_t: "17:00",
      },
      position: 1,
      estimatedWait: 15,
    });

    getTodayQueueForClinic.mockResolvedValue([
      {
        id: 1,
        status: "waiting",
      },
    ]);

    render(<PatientDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/Queue Clinic Queue/i)
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Your current position/i)
    ).toBeInTheDocument();
  });
  test("shows error when appointments fail to load", async () => {
    getPatientAppointments.mockRejectedValue(new Error("Network error"));

    render(<PatientDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/failed to load your appointments/i)
      ).toBeInTheDocument();
    });
  });
  test("shows error when queue fails to load", async () => {
    getMyActiveQueueStatusForToday.mockRejectedValue(
      new Error("Queue API error")
    );

    render(<PatientDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/failed to load your current queue/i)
      ).toBeInTheDocument();
    });
  });
  test("leaves queue successfully", async () => {
    getMyActiveQueueStatusForToday.mockResolvedValue({
      entry: { id: 99, clinic_id: 100, status: "waiting" },
      clinic: { facility_name: "Clinic", open_t: "08:00", closed_t: "17:00" },
      position: 1,
    });

    getTodayQueueForClinic.mockResolvedValue([{ id: 99 }]);

    render(<PatientDashboard />);

    await waitFor(() =>
      expect(screen.getByText(/leave queue/i)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText(/leave queue/i));

    await waitFor(() => {
      expect(
        screen.getByText(/you have left the queue successfully/i)
      ).toBeInTheDocument();
    });
  });
  test("closes cancel modal when clicking outside", async () => {
    render(<PatientDashboard />);

    await waitFor(() =>
      expect(screen.getByText(/cancel/i)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText(/cancel/i));

    expect(screen.getByText(/cancel appointment/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/cancel appointment/i).closest(".modal-overlay"));

    await waitFor(() => {
      expect(
        screen.queryByText(/cancel appointment/i)
      ).not.toBeInTheDocument();
    });
  });
  test("shows error when selecting past date for reschedule", async () => {
    render(<PatientDashboard />);

    fireEvent.click(
      await screen.findByRole("button", { name: /reschedule/i })
    );

    const dateInput = await screen.findByLabelText(/choose a new date/i);

    fireEvent.change(dateInput, { target: { value: "2000-01-01" } });

    await waitFor(() => {
      expect(
        screen.getByText(/please choose today or a future date/i)
      ).toBeInTheDocument();
    });
  });
  test("updates username successfully", async () => {
    render(<PatientDashboard />);

    fireEvent.click(screen.getByLabelText(/open menu/i));
    fireEvent.click(screen.getByText(/edit profile/i));

    const input = screen.getByLabelText(/new username/i);

    fireEvent.change(input, { target: { value: "NewName" } });

    fireEvent.click(screen.getByText(/update username/i));

    await waitFor(() => {
      expect(
        screen.getByText(/username updated successfully/i)
      ).toBeInTheDocument();
    });
  });
});