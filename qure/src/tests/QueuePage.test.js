import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import QueuePage from "../pages/QueuePage";
import { supabaseClient } from "../lib/supabaseClient";
import {
  isQueueOpenNow,
  joinQueue,
  leaveQueue,
  getTodayQueueForClinic,
  getMyQueueEntryForClinic,
  getMyActiveQueueStatusForToday,
  calculateEstimatedWait,
} from "../pages/queueService";
import { useNavigate } from "react-router-dom";

// -------------------- mocks --------------------

jest.mock("../lib/supabaseClient", () => ({
  supabaseClient: {
    from: jest.fn(),
  },
}));

jest.mock("../pages/queueService", () => ({
  isQueueOpenNow: jest.fn(),
  joinQueue: jest.fn(),
  leaveQueue: jest.fn(),
  getTodayQueueForClinic: jest.fn(),
  getMyQueueEntryForClinic: jest.fn(),
  getMyActiveQueueStatusForToday: jest.fn(),
  calculateEstimatedWait: jest.fn((pos) => pos * 10),
  QUEUE_OPEN_TIME: "08:00",
  QUEUE_CLOSE_TIME: "17:00",
  AVERAGE_CONSULTATION_MINUTES: 10,
}));

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

// -------------------- navigation mock --------------------

const navigateMock = jest.fn();

// -------------------- helpers --------------------

const setupSupabaseMock = (data = []) => {
  const select = jest.fn().mockReturnThis();
  const limit = jest.fn().mockReturnThis();
  const ilike = jest.fn().mockReturnThis();
  const eq = jest.fn().mockReturnThis();

  supabaseClient.from.mockReturnValue({
    select,
    limit,
    ilike,
    eq,
    then: (resolve) => resolve({ data, error: null }),
  });

  return { select, limit, ilike, eq };
};

const renderPage = async () => {
  await act(async () => {
    render(<QueuePage />);
  });
};

// -------------------- setup --------------------

beforeEach(() => {
  jest.clearAllMocks();

  // navigation mock FIX
  useNavigate.mockReturnValue(navigateMock);

  isQueueOpenNow.mockReturnValue(true);

  getMyActiveQueueStatusForToday.mockResolvedValue(null);
  getTodayQueueForClinic.mockResolvedValue([]);
  getMyQueueEntryForClinic.mockResolvedValue(null);

  joinQueue.mockResolvedValue();
  leaveQueue.mockResolvedValue();
});

// -------------------- tests --------------------

test("renders page correctly", async () => {
  await renderPage();

  expect(screen.getByText(/Clinic Queue/i)).toBeInTheDocument();
  expect(
    screen.getByPlaceholderText(/Search clinic by name/i)
  ).toBeInTheDocument();
});

test("debounced clinic search works", async () => {
  jest.useFakeTimers();

  setupSupabaseMock([
    {
      id: "1",
      facility_name: "Test Clinic",
      province: "Gauteng",
      facility_type: "Clinic",
    },
  ]);

  await renderPage();

  fireEvent.change(screen.getByPlaceholderText(/Search clinic by name/i), {
    target: { value: "Test" },
  });

  act(() => {
    jest.advanceTimersByTime(500);
  });

  await waitFor(() => {
    expect(screen.getByText("Test Clinic")).toBeInTheDocument();
  });

  jest.useRealTimers();
});

test("selecting clinic loads queue", async () => {
  setupSupabaseMock([
    {
      id: "1",
      facility_name: "Test Clinic",
      province: "Gauteng",
      facility_type: "Clinic",
    },
  ]);

  getTodayQueueForClinic.mockResolvedValue([{ id: "a", status: "waiting" }]);

  await renderPage();

  fireEvent.change(screen.getByPlaceholderText(/Search clinic by name/i), {
    target: { value: "Test" },
  });

  await act(async () => {
    jest.advanceTimersByTime(500);
  });

  fireEvent.click(await screen.findByText("Test Clinic"));

  await waitFor(() => {
    expect(screen.getByText(/Queue hours/i)).toBeInTheDocument();
    expect(screen.getByText(/Current queue length/i)).toBeInTheDocument();
  });
});

test("join queue success shows popup", async () => {
  setupSupabaseMock([
    {
      id: "1",
      facility_name: "Test Clinic",
    },
  ]);

  getTodayQueueForClinic.mockResolvedValue([]);
  getMyQueueEntryForClinic.mockResolvedValue(null);
  getMyActiveQueueStatusForToday.mockResolvedValue(null);

  await renderPage();

  fireEvent.change(screen.getByPlaceholderText(/Search clinic by name/i), {
    target: { value: "Test" },
  });

  await act(async () => {
    jest.advanceTimersByTime(500);
  });

  fireEvent.click(await screen.findByText("Test Clinic"));

  fireEvent.click(await screen.findByText(/Join Queue/i));

  await waitFor(() => {
    expect(joinQueue).toHaveBeenCalled();
    expect(
      screen.getByText(/Queue Joined Successfully/i)
    ).toBeInTheDocument();
  });
});

test("blocked join queue shows popup", async () => {
  setupSupabaseMock([{ id: "1", facility_name: "Test Clinic" }]);

  getTodayQueueForClinic.mockResolvedValue([]);
  getMyQueueEntryForClinic.mockResolvedValue(null);

  getMyActiveQueueStatusForToday.mockResolvedValue({
    entry: { clinic_id: "999" },
    clinic: { facility_name: "Other Clinic" },
    position: 3,
    estimatedWait: 30,
  });

  await renderPage();

  fireEvent.change(screen.getByPlaceholderText(/Search clinic by name/i), {
    target: { value: "Test" },
  });

  await act(async () => {
    jest.advanceTimersByTime(500);
  });

  fireEvent.click(await screen.findByText("Test Clinic"));

  fireEvent.click(await screen.findByText(/Join Queue/i));

  await waitFor(() => {
    expect(screen.getByText(/Already in a Queue/i)).toBeInTheDocument();
  });
});

test("leave queue works", async () => {
  setupSupabaseMock([{ id: "1", facility_name: "Test Clinic" }]);

  getTodayQueueForClinic.mockResolvedValue([
    { id: "q1", status: "waiting" },
  ]);

  getMyQueueEntryForClinic.mockResolvedValue({
    id: "q1",
    status: "waiting",
  });

  await renderPage();

  fireEvent.change(screen.getByPlaceholderText(/Search clinic by name/i), {
    target: { value: "Test" },
  });

  await act(async () => {
    jest.advanceTimersByTime(500);
  });

  fireEvent.click(await screen.findByText("Test Clinic"));

  fireEvent.click(await screen.findByText(/Leave Queue/i));

  await waitFor(() => {
    expect(leaveQueue).toHaveBeenCalled();
    expect(
      screen.getByText(/You have left the queue/i)
    ).toBeInTheDocument();
  });
});

test("navigates after closing success popup", async () => {
  setupSupabaseMock([{ id: "1", facility_name: "Test Clinic" }]);

  getTodayQueueForClinic.mockResolvedValue([]);
  getMyQueueEntryForClinic.mockResolvedValue(null);

  await renderPage();

  fireEvent.change(screen.getByPlaceholderText(/Search clinic by name/i), {
    target: { value: "Test" },
  });

  await act(async () => {
    jest.advanceTimersByTime(500);
  });

  fireEvent.click(await screen.findByText("Test Clinic"));

  fireEvent.click(await screen.findByText(/Join Queue/i));

  fireEvent.click(await screen.findByText(/Go to Dashboard/i));

  expect(navigateMock).toHaveBeenCalledWith("/patient");
});