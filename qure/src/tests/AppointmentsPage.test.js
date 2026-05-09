import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import AppointmentsPage from "../pages/AppointmentsPage";
import * as appointmentService from "../pages/appointmentService";
import { BrowserRouter } from "react-router-dom";

// -------------------- MOCKS --------------------

jest.mock("../pages/appointmentService");

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Helper wrapper
const renderComponent = () =>
  render(
    <BrowserRouter>
      <AppointmentsPage />
    </BrowserRouter>
  );

// -------------------- TEST DATA --------------------

const mockAppointments = [
  {
    id: 1,
    appointment_date: "2099-12-31",
    appointment_time: "10:00:00",
    status: "booked",
    clinic_id: 123,
    clinics: { facility_name: "Test Clinic A" },
  },
  {
    id: 2,
    appointment_date: "2020-01-01",
    appointment_time: "09:00:00",
    status: "completed",
    clinic_id: 456,
    clinics: { facility_name: "Test Clinic B" },
  },
];

// -------------------- TESTS --------------------

describe("AppointmentsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    appointmentService.getAllPatientAppointments.mockResolvedValue(
      mockAppointments
    );

    appointmentService.cancelAppointment.mockResolvedValue({});
    appointmentService.rescheduleAppointment.mockResolvedValue({});

    appointmentService.getBookedSlots.mockResolvedValue([]);
    appointmentService.generateHourlySlots.mockReturnValue([
      "09:00",
      "10:00",
      "11:00",
    ]);
  });

  test("renders loading state initially", async () => {
    renderComponent();

    expect(screen.getByText(/loading appointments/i)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.queryByText(/loading appointments/i)).not.toBeInTheDocument()
    );
  });

  test("renders appointments after load", async () => {
    renderComponent();

    expect(await screen.findByText("Test Clinic A")).toBeInTheDocument();
    expect(screen.getByText("Test Clinic B")).toBeInTheDocument();
  });

  test("filters appointments by status", async () => {
    renderComponent();

    await screen.findByText("Test Clinic A");

    const filter = screen.getByLabelText(/filter by status/i);

    fireEvent.change(filter, { target: { value: "completed" } });

    expect(screen.queryByText("Test Clinic A")).not.toBeInTheDocument();
    expect(screen.getByText("Test Clinic B")).toBeInTheDocument();
  });

  test("opens cancel modal", async () => {
    renderComponent();

    const cancelBtn = await screen.findAllByText("Cancel");

    fireEvent.click(cancelBtn[0]);

    expect(
      screen.getByText(/cancel appointment/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/are you sure you want to cancel/i)
    ).toBeInTheDocument();
  });

  test("confirms cancellation", async () => {
  renderComponent();

  const cancelBtn = await screen.findAllByText("Cancel");
  fireEvent.click(cancelBtn[0]);

  const confirmBtn = screen.getByText(/confirm cancel/i);
  fireEvent.click(confirmBtn);

  await waitFor(() => {
    expect(appointmentService.cancelAppointment).toHaveBeenCalledWith(1);
  });

  expect(
    await screen.findByText(/appointment cancelled successfully/i)
  ).toBeInTheDocument();
});

  test("opens reschedule modal", async () => {
    renderComponent();

    const rescheduleBtn = await screen.findAllByText("Reschedule");

    fireEvent.click(rescheduleBtn[0]);

    expect(
      screen.getByText(/reschedule appointment/i)
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/choose a new date/i)).toBeInTheDocument();
  });

  test("navigates back button", async () => {
    renderComponent();

    const backBtn = screen.getByText(/back/i);
    fireEvent.click(backBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/patient");
  });
});