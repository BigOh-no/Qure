import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import StaffDashboard from "../pages/Staff-dashboard";
import * as staffService from "../pages/staffService";

// Mock router
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock assets
jest.mock("../assets/images/TLogo.png", () => "logo.png");

// Mock service layer
jest.mock("../pages/staffService");

describe("StaffDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockQueue = {
    clinicName: "Test Clinic",
    patients: [
      {
        id: 1,
        patient_name: "John Doe",
        joined_at: "2026-05-08T10:00:00Z",
        status: "waiting",
      },
    ],
  };

  const mockAppointments = [
    {
      id: 1,
      patient_email: "john@test.com",
      appointment_date: "2026-05-10",
      appointment_time: "10:00",
      status: "booked",
    },
  ];

  test("renders clinic and queue data", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(mockQueue);
    staffService.getClinicAppointments.mockResolvedValue(mockAppointments);

    render(<StaffDashboard />);

    // ✅ Wait for real data instead of loading text
    await waitFor(() => {
      expect(screen.getByText("Test Clinic")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  test("shows empty queue state", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue({
      clinicName: "Test Clinic",
      patients: [],
    });

    staffService.getClinicAppointments.mockResolvedValue([]);

    render(<StaffDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/no patients in queue/i)).toBeInTheDocument();
    });
  });

  test("updates queue status", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(mockQueue);
    staffService.getClinicAppointments.mockResolvedValue([]);
    staffService.updateQueueStatus.mockResolvedValue({});

    render(<StaffDashboard />);

    await screen.findByText("John Doe");

    fireEvent.click(screen.getByText("Start"));

    await waitFor(() => {
      expect(staffService.updateQueueStatus).toHaveBeenCalledWith(
        1,
        "in_consultation"
      );
    });
  });

  test("creates appointment", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(mockQueue);
    staffService.getClinicAppointments.mockResolvedValue([]);

    staffService.staffCreateAppointment.mockResolvedValue({
      id: 2,
      patient_email: "new@test.com",
      appointment_date: "2026-05-12",
      appointment_time: "11:00",
      status: "booked",
    });

    render(<StaffDashboard />);

    fireEvent.change(
      screen.getByPlaceholderText(/enter patient email address/i),
      {
        target: { value: "new@test.com" },
      }
    );

    fireEvent.change(screen.getByLabelText(/appointment date/i), {
      target: { value: "2026-05-12" },
    });

    fireEvent.change(screen.getByLabelText(/appointment time/i), {
      target: { value: "11:00" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /create appointment/i })
    );

    await waitFor(() => {
      expect(staffService.staffCreateAppointment).toHaveBeenCalled();
    });
  });

  test("logout navigates home", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(mockQueue);
    staffService.getClinicAppointments.mockResolvedValue([]);

    render(<StaffDashboard />);

    fireEvent.click(screen.getByText(/logout/i));

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  test("cancels appointment", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(mockQueue);
    staffService.getClinicAppointments.mockResolvedValue(mockAppointments);

    staffService.staffCancelAppointment.mockResolvedValue({
      ...mockAppointments[0],
      status: "cancelled",
    });

    render(<StaffDashboard />);

    await screen.findByText("john@test.com");

    fireEvent.click(screen.getByText("Cancel"));

    await waitFor(() => {
      expect(staffService.staffCancelAppointment).toHaveBeenCalledWith(1);
    });
  });
});