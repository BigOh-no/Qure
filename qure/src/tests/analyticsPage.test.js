import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import AnalyticsPage from "../pages/analyticsPage";
import { supabaseClient } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

// -------------------- Mocks --------------------

jest.mock("../lib/supabaseClient", () => ({
  supabaseClient: {
    from: jest.fn(),
  },
}));

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

jest.mock("jspdf", () => {
  return jest.fn().mockImplementation(() => ({
    setFillColor: jest.fn(),
    rect: jest.fn(),
    setTextColor: jest.fn(),
    setFontSize: jest.fn(),
    text: jest.fn(),
    roundedRect: jest.fn(),
    save: jest.fn(),
    lastAutoTable: { finalY: 100 },
  }));
});

jest.mock("jspdf-autotable", () => jest.fn());

// -------------------- Browser APIs --------------------

global.URL.createObjectURL = jest.fn(() => "blob:url");
global.URL.revokeObjectURL = jest.fn();

// -------------------- Shared Mock Helper --------------------

const mockQuery = (data) => ({
  select: jest.fn().mockReturnThis(),
  not: jest.fn().mockResolvedValue({ data, error: null }),
});

// -------------------- Test Data --------------------

const queueData = [
  {
    id: 1,
    clinic_id: 1,
    joined_at: "2026-05-16T08:00:00.000Z",
    started_at: "2026-05-16T08:30:00.000Z",
    clinics: { facility_name: "Test Clinic" },
    status: "waiting",
  },
];

const appointmentData = [
  {
    id: 1,
    appointment_date: "2026-05-15",
    appointment_time: "07:00:00",
    status: "booked",
  },
  {
    id: 2,
    appointment_date: "2026-05-15",
    appointment_time: "07:00:00",
    status: "checked_in",
  },
];

// -------------------- Suite --------------------

describe("AnalyticsPage", () => {
  const navigateMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(navigateMock);
  });

  // -------------------- Helpers --------------------

  const mockSupabase = ({ queue = queueData, appointments = appointmentData }) => {
    supabaseClient.from.mockImplementation((table) => {
      if (table === "queue_entries") {
        return mockQuery(queue);
      }

      if (table === "appointments") {
        return mockQuery(appointments);
      }

      return mockQuery([]);
    });
  };

  // -------------------- Tests --------------------

  test("renders dashboard", () => {
    mockSupabase({});
    render(<AnalyticsPage />);
    expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
  });

  test("loads analytics correctly", async () => {
    mockSupabase({});

    render(<AnalyticsPage />);

    expect(
        await screen.findByText(/Queue Status Summary/i)
    ).toBeInTheDocument();

    expect(
        screen.getByText(/Appointment No-Show Rate/i)
    ).toBeInTheDocument();
  });

  test("renders wait-time data", async () => {
    mockSupabase({});

    render(<AnalyticsPage />);

    expect(
      await screen.findByText(/Test Clinic — Morning/i)
    ).toBeInTheDocument();
  });

  test("navigates back to admin", () => {
    mockSupabase({});

    render(<AnalyticsPage />);

    fireEvent.click(screen.getByText(/Back to Admin/i));

    expect(navigateMock).toHaveBeenCalledWith("/admin");
  });

  test("exports CSV safely", async () => {
    mockSupabase({});

    render(<AnalyticsPage />);

    const btn = await screen.findByText(/Export CSV/i);
    fireEvent.click(btn);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });

  test("exports PDF safely", async () => {
    const jsPDF = require("jspdf");

    mockSupabase({});

    render(<AnalyticsPage />);

    const btn = await screen.findByText(/Export PDF/i);
    fireEvent.click(btn);

    expect(jsPDF).toHaveBeenCalled();
  });

  test("handles empty queue safely (FIXED)", async () => {
    // IMPORTANT: mock BEFORE render
    mockSupabase({ queue: [], appointments: [] });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading analytics/i)).not.toBeInTheDocument();
    });

    expect(
      await screen.findByText(/No wait-time data available yet/i)
    ).toBeInTheDocument();
  });
});