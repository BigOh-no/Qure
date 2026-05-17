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

// ---------------- MOCKS ----------------

jest.mock("../styles/Patient.css", () => ({}));
jest.mock("../styles/Queue.css", () => ({}));
jest.mock("../assets/images/TLogo.png", () => "logo.png");

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// ---------------- SERVICES ----------------

const mockGetPatientAppointments = jest.fn();
const mockCancelAppointment = jest.fn();
const mockRescheduleAppointment = jest.fn();
const mockGetBookedSlots = jest.fn();
const mockGenerateHourlySlots = jest.fn();

jest.mock("../pages/appointmentService", () => ({
  getPatientAppointments: (...a) =>
    mockGetPatientAppointments(...a),
  cancelAppointment: (...a) =>
    mockCancelAppointment(...a),
  rescheduleAppointment: (...a) =>
    mockRescheduleAppointment(...a),
  getBookedSlots: (...a) =>
    mockGetBookedSlots(...a),
  generateHourlySlots: (...a) =>
    mockGenerateHourlySlots(...a),
}));

// ---------------- QUEUE ----------------

const mockCalculateEstimatedWait = jest.fn();
const mockGetMyActiveQueueStatusForToday = jest.fn();
const mockGetTodayQueueForClinic = jest.fn();

jest.mock("../pages/queueService", () => ({
  QUEUE_OPEN_TIME: "08:00",
  QUEUE_CLOSE_TIME: "17:00",
  AVERAGE_CONSULTATION_MINUTES: 15,
  calculateEstimatedWait: (...a) =>
    mockCalculateEstimatedWait(...a),
  getMyActiveQueueStatusForToday: (...a) =>
    mockGetMyActiveQueueStatusForToday(...a),
  getTodayQueueForClinic: (...a) =>
    mockGetTodayQueueForClinic(...a),
}));

// ---------------- SUPABASE ----------------

const mockSingle = jest.fn();
const mockEq = jest.fn();
const mockUpdate = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();

const mockAuthGetUser = jest.fn();
const mockSignOut = jest.fn();

jest.mock("../lib/supabaseClient", () => ({
  supabaseClient: {
    auth: {
      getUser: (...a) => mockAuthGetUser(...a),
      signOut: (...a) => mockSignOut(...a),
    },
    from: (...args) => mockFrom(...args),
  },
}));

// ---------------- TEST DATA ----------------

const mockAppointments = [
  {
    id: 1,
    clinic_id: 10,
    appointment_date: "2099-12-25",
    appointment_time: "10:00:00",
    status: "booked",
    clinics: {
      facility_name: "City Clinic",
    },
  },
];

const renderComponent = () =>
  render(<PatientDashboard />);

// ---------------- DEFAULT SETUP ----------------

beforeEach(() => {
  jest.clearAllMocks();

  mockAuthGetUser.mockResolvedValue({
    data: {
      user: {
        id: "user-1",
        email: "patient@test.com",
        user_metadata: {
          full_name: "John Doe",
        },
      },
    },
    error: null,
  });

  mockFrom.mockReturnValue({
    select: mockSelect,
    update: mockUpdate,
  });

  mockSelect.mockReturnValue({
    eq: mockEq,
  });

  mockEq.mockReturnValue({
    single: mockSingle,
  });

  mockSingle.mockResolvedValue({
    data: { user_name: "Johnny" },
    error: null,
  });

  mockUpdate.mockReturnValue({
    eq: jest.fn().mockResolvedValue({
      error: null,
    }),
  });

  mockGetPatientAppointments.mockResolvedValue(
    mockAppointments
  );

  mockGetMyActiveQueueStatusForToday.mockResolvedValue(null);
  mockGetTodayQueueForClinic.mockResolvedValue([]);

  mockGenerateHourlySlots.mockReturnValue([
    "09:00",
    "10:00",
    "11:00",
  ]);

  mockGetBookedSlots.mockResolvedValue(["11:00"]);
});

// ---------------- TEST CASES ----------------

test("renders dashboard with username and appointments", async () => {
  renderComponent();

  expect(
    screen.getByText(/loading appointments/i)
  ).toBeInTheDocument();

  expect(
    await screen.findByRole("heading", {
      name: /hi,\s*johnny/i,
    })
  ).toBeInTheDocument();

  expect(
    screen.getByText(/city clinic/i)
  ).toBeInTheDocument();
});

test("renders empty appointments state", async () => {
  mockGetPatientAppointments.mockResolvedValue([]);

  renderComponent();

  expect(
    await screen.findByText(/no current appointments/i)
  ).toBeInTheDocument();
});

test("renders queue information when active queue exists", async () => {
  mockGetMyActiveQueueStatusForToday.mockResolvedValue({
    position: 1,
    estimatedWait: 15,
    clinic: {
      facility_name: "Health Clinic",
    },
    entry: {
      id: 55,
      clinic_id: 10,
      status: "waiting",
    },
  });

  mockGetTodayQueueForClinic.mockResolvedValue([
    { id: 55 },
  ]);

  renderComponent();

  expect(
    await screen.findByText(/health clinic queue/i)
  ).toBeInTheDocument();
});

test("navigates to booking page", async () => {
  renderComponent();

  const button = await screen.findByRole("button", {
    name: /book appointment/i,
  });

  userEvent.click(button);

  expect(mockNavigate).toHaveBeenCalledWith(
    "/patient/book"
  );
});

test("navigates to queue page", async () => {
  renderComponent();

  const button = await screen.findByRole("button", {
    name: /join queue/i,
  });

  userEvent.click(button);

  expect(mockNavigate).toHaveBeenCalledWith(
    "/patient/queue"
  );
});

test("opens and closes cancel modal", async () => {
  renderComponent();

  const cancelButton = await screen.findByRole("button", {
    name: /^cancel$/i,
  });

  userEvent.click(cancelButton);

  expect(
    screen.getByText(/cancel appointment/i)
  ).toBeInTheDocument();

  const closeButton = screen.getByRole("button", {
    name: /^close$/i,
  });

  userEvent.click(closeButton);

  await waitFor(() => {
    expect(
      screen.queryByText(/cancel appointment/i)
    ).not.toBeInTheDocument();
  });
});

test("cancels appointment successfully", async () => {
  mockCancelAppointment.mockResolvedValue({});

  renderComponent();

  const cancelButton = await screen.findByRole("button", {
    name: /^cancel$/i,
  });

  userEvent.click(cancelButton);

  const confirmButton = screen.getByRole("button", {
    name: /confirm cancel/i,
  });

  userEvent.click(confirmButton);

  await waitFor(() => {
    expect(mockCancelAppointment).toHaveBeenCalledWith(1);
  });

  expect(
    await screen.findByText(
      /appointment cancelled successfully/i
    )
  ).toBeInTheDocument();
});

test("opens reschedule modal and loads slots", async () => {
  renderComponent();

  const rescheduleButton = await screen.findByRole(
    "button",
    { name: /^reschedule$/i }
  );

  userEvent.click(rescheduleButton);

  expect(
    screen.getByText(/reschedule appointment/i)
  ).toBeInTheDocument();

  // wait for slots to actually render
  const slotButton = await screen.findByRole("button", {
    name: "09:00",
  });

  expect(slotButton).toBeInTheDocument();

  expect(
    screen.getByRole("button", { name: "10:00" })
  ).toBeInTheDocument();
});

test("reschedules appointment successfully", async () => {
  mockRescheduleAppointment.mockResolvedValue({});

  renderComponent();

  const button = await screen.findByRole("button", {
    name: /^reschedule$/i,
  });

  userEvent.click(button);

  const slotButton = await screen.findByRole("button", {
    name: "10:00",
  });

  userEvent.click(slotButton);

  const confirmButton = screen.getByRole("button", {
    name: /^confirm$/i,
  });

  userEvent.click(confirmButton);

  await waitFor(() => {
    expect(mockRescheduleAppointment).toHaveBeenCalled();
  });
});

test("shows validation error when rescheduling without slot", async () => {
  renderComponent();

  const button = await screen.findByRole("button", {
    name: /^reschedule$/i,
  });

  userEvent.click(button);

  const confirmButton = screen.getByRole("button", {
    name: /^confirm$/i,
  });

  expect(confirmButton).toBeDisabled();
});

test("opens profile popup", async () => {
  renderComponent();

  const menuButton = await screen.findByLabelText(
    /open menu/i
  );

  fireEvent.click(menuButton);

  const editProfileButton = await screen.findByRole(
    "button",
    {
      name: /edit profile/i,
    }
  );

  userEvent.click(editProfileButton);

  expect(
    screen.getByRole("heading", {
      name: /edit profile/i,
    })
  ).toBeInTheDocument();
});

test("updates username successfully", async () => {
  const eqChain = jest.fn().mockResolvedValue({
    error: null,
  });

  mockUpdate.mockReturnValue({
    eq: eqChain,
  });

  renderComponent();

  const menuButton = await screen.findByLabelText(
    /open menu/i
  );

  fireEvent.click(menuButton);

  const editProfileButton =
    await screen.findByRole("button", {
      name: /edit profile/i,
    });

  userEvent.click(editProfileButton);

  const input =
    await screen.findByLabelText(/new username/i);

  fireEvent.change(input, {
    target: { value: "UpdatedName" },
  });

  const updateBtn = screen.getByRole("button", {
    name: /update username/i,
  });

  fireEvent.click(updateBtn);

  await waitFor(() => {
    expect(mockUpdate).toHaveBeenCalledWith({
      user_name: "UpdatedName",
    });
  });
});

test("shows password mismatch validation", async () => {
  renderComponent();

  const menuButton = await screen.findByLabelText(
    /open menu/i
  );

  fireEvent.click(menuButton);

  const editProfileButton =
    await screen.findByRole("button", {
      name: /edit profile/i,
    });

  userEvent.click(editProfileButton);

  const passwordField = screen.getByLabelText(
    /^new password$/i
  );

  const confirmField = screen.getByLabelText(
    /confirm password/i
  );

  fireEvent.change(passwordField, {
    target: { value: "password123" },
  });

  fireEvent.change(confirmField, {
    target: { value: "password999" },
  });

  const updateButton = screen.getByRole("button", {
    name: /update password/i,
  });

  userEvent.click(updateButton);

  expect(
    await screen.findByText(/passwords do not match/i)
  ).toBeInTheDocument();
});

test("logs out successfully", async () => {
  renderComponent();

  const menuButton = await screen.findByLabelText(
    /open menu/i
  );

  fireEvent.click(menuButton);

  const logoutButton = await screen.findByRole("button", {
    name: /logout/i,
  });

  userEvent.click(logoutButton);

  await waitFor(() => {
    expect(mockSignOut).toHaveBeenCalled();
  });

  expect(mockNavigate).toHaveBeenCalledWith("/");
});

test("shows appointment loading error", async () => {
  mockGetPatientAppointments.mockRejectedValue(
    new Error("Failed")
  );

  renderComponent();

  expect(
    await screen.findByText(
      /failed to load your appointments/i
    )
  ).toBeInTheDocument();
});

test("shows queue empty state", async () => {
  renderComponent();

  expect(
    await screen.findByText(/you are not in a queue/i)
  ).toBeInTheDocument();
});