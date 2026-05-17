import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
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
    clinics: {
      facility_name: "Test Clinic A",
      open_t: "08:00",
      closed_t: "17:00",
    },
  },
  {
    id: 2,
    appointment_date: "2020-01-01",
    appointment_time: "09:00:00",
    status: "completed",
    clinic_id: 456,
    clinics: {
      facility_name: "Test Clinic B",
      open_t: "08:00",
      closed_t: "17:00",
    },
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

    // Default: all slots within clinic hours, formatClinicHours returns a string
    appointmentService.isSlotWithinClinicHours.mockReturnValue(true);
    appointmentService.formatClinicHours.mockReturnValue("08:00 - 17:00");
  });

  // ── Original tests (unchanged) ────────────────────────────────────────────

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

    expect(screen.getByText(/cancel appointment/i)).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to cancel/i)).toBeInTheDocument();
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

    expect(screen.getByText(/reschedule appointment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/choose a new date/i)).toBeInTheDocument();
  });

  test("navigates back button", async () => {
    renderComponent();

    const backBtn = screen.getByText(/back/i);
    fireEvent.click(backBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/patient");
  });

  test("loads available slots when reschedule modal opens and date is selected", async () => {
    appointmentService.getBookedSlots.mockResolvedValue(["10:00"]);

    renderComponent();

    const rescheduleBtn = await screen.findAllByText("Reschedule");
    fireEvent.click(rescheduleBtn[0]);

    const dateInput = screen.getByLabelText(/choose a new date/i);
    fireEvent.change(dateInput, { target: { value: "2099-12-31" } });

    await waitFor(() => {
      expect(appointmentService.generateHourlySlots).toHaveBeenCalled();
    });
  });

  test("shows error when selecting past date", async () => {
    renderComponent();

    const rescheduleBtn = await screen.findAllByText("Reschedule");
    fireEvent.click(rescheduleBtn[0]);

    const dateInput = screen.getByLabelText(/choose a new date/i);
    fireEvent.change(dateInput, { target: { value: "2000-01-01" } });

    await waitFor(() => {
      expect(screen.getByText(/choose today or a future date/i)).toBeInTheDocument();
    });
  });

  test("success popup closes when OK clicked", async () => {
    appointmentService.cancelAppointment.mockResolvedValue({});

    renderComponent();

    const cancelBtn = await screen.findAllByText("Cancel");
    fireEvent.click(cancelBtn[0]);

    fireEvent.click(screen.getByText(/confirm cancel/i));

    const okBtn = await screen.findByText("OK");
    fireEvent.click(okBtn);

    expect(screen.queryByText("Success")).not.toBeInTheDocument();
  });

  test("sorts appointments ascending", async () => {
    renderComponent();

    await screen.findByText("Test Clinic A");

    const sortSelect = screen.getByLabelText(/sort by date/i);
    fireEvent.change(sortSelect, { target: { value: "asc" } });

    const items = screen.getAllByText(/clinic:/i);
    expect(items.length).toBeGreaterThanOrEqual(2);
  });

  // ── Additional tests ──────────────────────────────────────────────────────

  // ── Error states ──────────────────────────────────────────────────────────

  test("shows error message when appointments fail to load", async () => {
    appointmentService.getAllPatientAppointments.mockRejectedValue(
      new Error("Network error")
    );

    renderComponent();

    await waitFor(() =>
      expect(
        screen.getByText(/failed to load your appointments/i)
      ).toBeInTheDocument()
    );
  });

  test("shows error message when cancellation fails", async () => {
    appointmentService.cancelAppointment.mockRejectedValue(
      new Error("Server error")
    );

    renderComponent();

    const cancelBtn = await screen.findAllByText("Cancel");
    fireEvent.click(cancelBtn[0]);
    fireEvent.click(screen.getByText(/confirm cancel/i));

    await waitFor(() =>
      expect(screen.getByText(/server error/i)).toBeInTheDocument()
    );
  });

  test("shows generic error when cancellation fails without message", async () => {
    appointmentService.cancelAppointment.mockRejectedValue({});

    renderComponent();

    const cancelBtn = await screen.findAllByText("Cancel");
    fireEvent.click(cancelBtn[0]);
    fireEvent.click(screen.getByText(/confirm cancel/i));

    await waitFor(() =>
      expect(screen.getByText(/failed to cancel appointment/i)).toBeInTheDocument()
    );
  });

  // ── Empty state ───────────────────────────────────────────────────────────

  test("shows empty state when no appointments exist", async () => {
    appointmentService.getAllPatientAppointments.mockResolvedValue([]);

    renderComponent();

    await waitFor(() =>
      expect(screen.getByText(/no appointments found/i)).toBeInTheDocument()
    );
  });

  test("shows empty state when filter matches nothing", async () => {
    // All appointments are booked/completed — filter for 'cancelled' yields nothing
    renderComponent();

    await screen.findByText("Test Clinic A");

    fireEvent.change(screen.getByLabelText(/filter by status/i), {
      target: { value: "cancelled" },
    });

    expect(screen.getByText(/no appointments found/i)).toBeInTheDocument();
  });

  // ── Status display ────────────────────────────────────────────────────────

  test("displays 'Upcoming' status for future booked appointments", async () => {
    renderComponent();
    const card = await screen.findByText("Test Clinic A");
    const article = card.closest("article");
    expect(within(article).getByText("Upcoming")).toBeInTheDocument();
  });

  test("displays 'Completed' status for completed appointments", async () => {
    renderComponent();
    const card = await screen.findByText("Test Clinic B");
    const article = card.closest("article");
    expect(within(article).getByText("Completed")).toBeInTheDocument();
  });

  test("displays 'Cancelled' for cancelled appointments", async () => {
    appointmentService.getAllPatientAppointments.mockResolvedValue([
      {
        id: 3,
        appointment_date: "2020-06-01",
        appointment_time: "09:00:00",
        status: "cancelled",
        clinic_id: 789,
        clinics: { facility_name: "Test Clinic C" },
      },
    ]);

    renderComponent();
    const card = await screen.findByText("Test Clinic C");
    const article = card.closest("article");
    expect(within(article).getByText("Cancelled")).toBeInTheDocument();
  });

  test("displays 'Past' for past booked appointments", async () => {
    appointmentService.getAllPatientAppointments.mockResolvedValue([
      {
        id: 4,
        appointment_date: "2020-06-01",
        appointment_time: "09:00:00",
        status: "booked",
        clinic_id: 789,
        clinics: { facility_name: "Test Clinic D" },
      },
    ]);

    renderComponent();
    const card = await screen.findByText("Test Clinic D");
    const article = card.closest("article");
    expect(within(article).getByText("Past")).toBeInTheDocument();
  });

  test("past and cancelled appointments show 'cannot be changed' note instead of action buttons", async () => {
    renderComponent();
    await screen.findByText("Test Clinic B"); // completed appointment
    const readonlyNotes = screen.getAllByText(/this appointment cannot be changed/i);
    expect(readonlyNotes.length).toBeGreaterThanOrEqual(1);
  });

  // ── Filtering ─────────────────────────────────────────────────────────────

  test("filters appointments by 'upcoming'", async () => {
    renderComponent();
    await screen.findByText("Test Clinic A");

    fireEvent.change(screen.getByLabelText(/filter by status/i), {
      target: { value: "upcoming" },
    });

    expect(screen.getByText("Test Clinic A")).toBeInTheDocument();
    expect(screen.queryByText("Test Clinic B")).not.toBeInTheDocument();
  });

  test("filters appointments by 'past'", async () => {
    appointmentService.getAllPatientAppointments.mockResolvedValue([
      ...mockAppointments,
      {
        id: 5,
        appointment_date: "2019-01-01",
        appointment_time: "08:00:00",
        status: "booked",
        clinic_id: 999,
        clinics: { facility_name: "Old Clinic" },
      },
    ]);

    renderComponent();
    await screen.findByText("Old Clinic");

    fireEvent.change(screen.getByLabelText(/filter by status/i), {
      target: { value: "past" },
    });

    expect(screen.getByText("Old Clinic")).toBeInTheDocument();
    expect(screen.queryByText("Test Clinic A")).not.toBeInTheDocument();
    expect(screen.queryByText("Test Clinic B")).not.toBeInTheDocument();
  });

  test("'all' filter shows every appointment", async () => {
    renderComponent();
    await screen.findByText("Test Clinic A");

    // Switch to a different filter then back to 'all'
    fireEvent.change(screen.getByLabelText(/filter by status/i), {
      target: { value: "upcoming" },
    });
    fireEvent.change(screen.getByLabelText(/filter by status/i), {
      target: { value: "all" },
    });

    expect(screen.getByText("Test Clinic A")).toBeInTheDocument();
    expect(screen.getByText("Test Clinic B")).toBeInTheDocument();
  });

  // ── Cancel modal ──────────────────────────────────────────────────────────

  test("cancel modal shows correct appointment details", async () => {
    renderComponent();

    const cancelBtn = await screen.findAllByText("Cancel");
    fireEvent.click(cancelBtn[0]);

    // The modal should show the clinic name for appointment 1
    const modal = screen.getByText(/cancel appointment/i).closest("section");
    expect(within(modal).getByText("Test Clinic A")).toBeInTheDocument();
    expect(within(modal).getByText("2099-12-31")).toBeInTheDocument();
  });

  test("cancel modal closes when Close button is clicked", async () => {
    renderComponent();

    const cancelBtn = await screen.findAllByText("Cancel");
    fireEvent.click(cancelBtn[0]);

    expect(screen.getByText(/are you sure you want to cancel/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^close$/i }));

    expect(
      screen.queryByText(/are you sure you want to cancel/i)
    ).not.toBeInTheDocument();
  });

  test("cancel modal closes when overlay is clicked", async () => {
    renderComponent();

    const cancelBtn = await screen.findAllByText("Cancel");
    fireEvent.click(cancelBtn[0]);

    // Click the overlay (the outer section with modal-overlay class)
    const overlay = document.querySelector(".modal-overlay");
    fireEvent.click(overlay);

    expect(
      screen.queryByText(/are you sure you want to cancel/i)
    ).not.toBeInTheDocument();
  });

  test("appointment status updates to cancelled in list after successful cancellation", async () => {
    renderComponent();

    await screen.findByText("Test Clinic A");

    const cancelBtn = await screen.findAllByText("Cancel");
    fireEvent.click(cancelBtn[0]);
    fireEvent.click(screen.getByText(/confirm cancel/i));

    await waitFor(() =>
      expect(screen.queryByText(/confirm cancel/i)).not.toBeInTheDocument()
    );

    // The appointment card for Test Clinic A should now show Cancelled
    await waitFor(() =>
      expect(screen.getByText("Cancelled")).toBeInTheDocument()
    );
  });

  // ── Reschedule modal ──────────────────────────────────────────────────────

  test("reschedule modal shows clinic name and hours", async () => {
    renderComponent();

    const rescheduleBtn = await screen.findAllByText("Reschedule");
    fireEvent.click(rescheduleBtn[0]);

    const modal = document.querySelector(".reschedule-modal");
    expect(within(modal).getByText("Test Clinic A")).toBeInTheDocument();
    expect(within(modal).getByText(/08:00 - 17:00/)).toBeInTheDocument();
  });

  test("reschedule modal closes when Close is clicked", async () => {
    renderComponent();

    const rescheduleBtn = await screen.findAllByText("Reschedule");
    fireEvent.click(rescheduleBtn[0]);

    expect(screen.getByText(/reschedule appointment/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^close$/i }));

    expect(
      screen.queryByText(/reschedule appointment/i)
    ).not.toBeInTheDocument();
  });

  test("reschedule modal closes when overlay is clicked", async () => {
    renderComponent();

    const rescheduleBtn = await screen.findAllByText("Reschedule");
    fireEvent.click(rescheduleBtn[0]);

    const overlay = document.querySelector(".modal-overlay");
    fireEvent.click(overlay);

    expect(
      screen.queryByText(/reschedule appointment/i)
    ).not.toBeInTheDocument();
  });

  test("Confirm button is disabled when no slot is selected", async () => {
    renderComponent();

    const rescheduleBtn = await screen.findAllByText("Reschedule");
    fireEvent.click(rescheduleBtn[0]);

    const confirmBtn = screen.getByRole("button", { name: /^confirm$/i });
    expect(confirmBtn).toBeDisabled();
  });

  test("selecting an available slot enables the Confirm button", async () => {
    appointmentService.getBookedSlots.mockResolvedValue([]);

    renderComponent();

    const rescheduleBtn = await screen.findAllByText("Reschedule");
    fireEvent.click(rescheduleBtn[0]);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /11:00/ })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /11:00/ }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^confirm$/i })).not.toBeDisabled()
    );
  });

  test("Confirm button remains disabled when no slot is selected", async () => {
    renderComponent();

    const rescheduleBtn = await screen.findAllByText("Reschedule");
    fireEvent.click(rescheduleBtn[0]);

    // Slots are loaded for the appointment's own date (2099-12-31) on modal open
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /11:00/ })).toBeInTheDocument()
    );

    // Without clicking any slot, Confirm must stay disabled
    expect(screen.getByRole("button", { name: /^confirm$/i })).toBeDisabled();
  });

  test("confirms reschedule successfully and shows success popup", async () => {
    appointmentService.getBookedSlots.mockResolvedValue([]);
    appointmentService.rescheduleAppointment.mockResolvedValue({});

    renderComponent();

    const rescheduleBtn = await screen.findAllByText("Reschedule");
    fireEvent.click(rescheduleBtn[0]);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /11:00/ })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /11:00/ }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^confirm$/i })).not.toBeDisabled()
    );

    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));

    await waitFor(() =>
      expect(appointmentService.rescheduleAppointment).toHaveBeenCalledWith({
        appointmentId: 1,
        clinicId: 123,
        appointmentDate: "2099-12-31",
        appointmentTime: "11:00",
      })
    );

    expect(
      await screen.findByText(/appointment rescheduled successfully/i)
    ).toBeInTheDocument();
  });

  test("reschedule closes modal on success", async () => {
    appointmentService.getBookedSlots.mockResolvedValue([]);
    appointmentService.rescheduleAppointment.mockResolvedValue({});

    renderComponent();

    const rescheduleBtn = await screen.findAllByText("Reschedule");
    fireEvent.click(rescheduleBtn[0]);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /11:00/ })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /11:00/ }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^confirm$/i })).not.toBeDisabled()
    );

    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));

    await waitFor(() =>
      expect(
        screen.queryByText(/reschedule appointment/i)
      ).not.toBeInTheDocument()
    );
  });

  test("shows generic error when reschedule fails", async () => {
    appointmentService.getBookedSlots.mockResolvedValue([]);
    appointmentService.rescheduleAppointment.mockRejectedValue(
      new Error("Unexpected failure")
    );

    renderComponent();

    const rescheduleBtn = await screen.findAllByText("Reschedule");
    fireEvent.click(rescheduleBtn[0]);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /11:00/ })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /11:00/ }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^confirm$/i })).not.toBeDisabled()
    );

    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));

    await waitFor(() =>
      expect(screen.getByText(/unexpected failure/i)).toBeInTheDocument()
    );
  });

  test("shows duplicate slot error (code 23505) when reschedule fails with conflict", async () => {
    appointmentService.getBookedSlots.mockResolvedValue([]);
    const conflictError = new Error("Duplicate");
    conflictError.code = "23505";
    appointmentService.rescheduleAppointment.mockRejectedValue(conflictError);

    renderComponent();

    const rescheduleBtn = await screen.findAllByText("Reschedule");
    fireEvent.click(rescheduleBtn[0]);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /11:00/ })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /11:00/ }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^confirm$/i })).not.toBeDisabled()
    );

    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/that slot has already been booked/i)
      ).toBeInTheDocument()
    );
  });

  test("shows error when slot loading fails", async () => {
    appointmentService.getBookedSlots.mockRejectedValue(new Error("Slot fetch failed"));

    renderComponent();

    const rescheduleBtn = await screen.findAllByText("Reschedule");
    fireEvent.click(rescheduleBtn[0]);

    await waitFor(() =>
      expect(screen.getByText(/failed to load available slots/i)).toBeInTheDocument()
    );
  });

  test("appointment list updates after successful reschedule", async () => {
    appointmentService.getBookedSlots.mockResolvedValue([]);
    appointmentService.rescheduleAppointment.mockResolvedValue({});

    renderComponent();

    const rescheduleBtn = await screen.findAllByText("Reschedule");
    fireEvent.click(rescheduleBtn[0]);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /11:00/ })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /11:00/ }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^confirm$/i })).not.toBeDisabled()
    );

    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));

    await waitFor(() =>
      expect(
        screen.queryByText(/reschedule appointment/i)
      ).not.toBeInTheDocument()
    );

    // The appointment should still be visible (rescheduled to same clinic)
    expect(screen.getByText("Test Clinic A")).toBeInTheDocument();
  });

  // ── Success popup ─────────────────────────────────────────────────────────

  test("success popup closes when overlay is clicked", async () => {
    renderComponent();

    const cancelBtn = await screen.findAllByText("Cancel");
    fireEvent.click(cancelBtn[0]);
    fireEvent.click(screen.getByText(/confirm cancel/i));

    await screen.findByText("Success");

    const overlay = document.querySelector(".modal-overlay");
    fireEvent.click(overlay);

    expect(screen.queryByText("Success")).not.toBeInTheDocument();
  });

  // ── Clinic name fallback ──────────────────────────────────────────────────

  test("shows 'Unknown Clinic' when clinics data is missing", async () => {
    appointmentService.getAllPatientAppointments.mockResolvedValue([
      {
        id: 10,
        appointment_date: "2099-01-01",
        appointment_time: "10:00:00",
        status: "booked",
        clinic_id: 999,
        clinics: null,
      },
    ]);

    renderComponent();

    await waitFor(() =>
      expect(screen.getByText("Unknown Clinic")).toBeInTheDocument()
    );
  });

  // ── Appointment time display ──────────────────────────────────────────────

  test("slices appointment time to HH:MM for display", async () => {
    renderComponent();
    await screen.findByText("Test Clinic A");
    // appointment_time is "10:00:00" → should display "10:00"
    expect(screen.getByText("10:00")).toBeInTheDocument();
  });

  test("renders empty time when appointment_time is null", async () => {
    appointmentService.getAllPatientAppointments.mockResolvedValue([
      {
        id: 11,
        appointment_date: "2099-01-01",
        appointment_time: null,
        status: "booked",
        clinic_id: 111,
        clinics: { facility_name: "No Time Clinic" },
      },
    ]);

    renderComponent();

    await screen.findByText("No Time Clinic");
    // Should not crash and time field should be blank
    expect(screen.getByText("No Time Clinic")).toBeInTheDocument();
  });

  // ── Slot display edge cases ───────────────────────────────────────────────

  test("shows 'No slots found' message when generateHourlySlots returns empty", async () => {
    appointmentService.generateHourlySlots.mockReturnValue([]);

    renderComponent();

    const rescheduleBtn = await screen.findAllByText("Reschedule");
    fireEvent.click(rescheduleBtn[0]);

    await waitFor(() =>
      expect(screen.getByText(/no slots found for this date/i)).toBeInTheDocument()
    );
  });

  test("slots outside clinic hours are disabled", async () => {
    // 09:00 is outside clinic hours; 10:00 and 11:00 are inside
    appointmentService.isSlotWithinClinicHours.mockImplementation(
      (slot) => slot !== "09:00"
    );

    renderComponent();

    const rescheduleBtn = await screen.findAllByText("Reschedule");
    fireEvent.click(rescheduleBtn[0]);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /09:00/ })).toBeInTheDocument()
    );

    expect(screen.getByRole("button", { name: /09:00/ })).toBeDisabled();
  });
});