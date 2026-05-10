import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import QueuePage from "../pages/QueuePage";
import { searchClinics } from "../pages/clinicService";
import {
  isQueueOpenNow,
  joinQueue,
  leaveQueue,
  getTodayQueueForClinic,
  getMyQueueEntryForClinic,
  getMyActiveQueueStatusForToday,
} from "../pages/queueService";
import { useNavigate } from "react-router-dom";

// -------------------- mocks --------------------

jest.mock("../pages/ClinicMap.js", () => {
  const React = require("react");

  return function MockClinicMap() {
    return React.createElement(
      "section",
      { "data-testid": "clinic-map" },
      "Mock Clinic Map"
    );
  };
});

jest.mock("../pages/clinicService", () => ({
  searchClinics: jest.fn(),
}));

jest.mock("../pages/queueService", () => ({
  isQueueOpenNow: jest.fn(),
  joinQueue: jest.fn(),
  leaveQueue: jest.fn(),
  getTodayQueueForClinic: jest.fn(),
  getMyQueueEntryForClinic: jest.fn(),
  getMyActiveQueueStatusForToday: jest.fn(),
  calculateEstimatedWait: jest.fn((position) => {
    if (!position || position <= 1) return 0;
    return (position - 1) * 10;
  }),
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

const testClinic = {
  id: "1",
  facility_name: "Test Clinic",
  admin1: "Gauteng",
  facility_type: "Clinic",
};

const renderPage = async () => {
  await act(async () => {
    render(<QueuePage />);
  });
};

const searchForClinic = async () => {
  fireEvent.change(screen.getByPlaceholderText(/Type clinic name/i), {
    target: { value: "Test" },
  });

  await act(async () => {
    jest.advanceTimersByTime(500);
  });
};

// -------------------- setup --------------------

beforeEach(() => {
  jest.clearAllMocks();

  useNavigate.mockReturnValue(navigateMock);

  isQueueOpenNow.mockReturnValue(true);

  searchClinics.mockResolvedValue([testClinic]);

  getMyActiveQueueStatusForToday.mockResolvedValue(null);
  getTodayQueueForClinic.mockResolvedValue([]);
  getMyQueueEntryForClinic.mockResolvedValue(null);

  joinQueue.mockResolvedValue();
  leaveQueue.mockResolvedValue();
});

afterEach(() => {
  jest.useRealTimers();
});

// -------------------- tests --------------------

test("renders page correctly", async () => {
  await renderPage();

  expect(screen.getByText(/Clinic Queue/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Type clinic name/i)).toBeInTheDocument();
  expect(screen.getByText(/Find a Clinic/i)).toBeInTheDocument();
});

test("debounced clinic search works", async () => {
  jest.useFakeTimers();

  await renderPage();

  await searchForClinic();

  await waitFor(() => {
    expect(searchClinics).toHaveBeenCalledWith({
      searchTerm: "Test",
      admin1: "",
      facilityType: "",
    });

    expect(screen.getByText("Test Clinic")).toBeInTheDocument();
    expect(screen.getByText(/Province:/i)).toBeInTheDocument();
    expect(screen.getByText(/Type:/i)).toBeInTheDocument();
  });
});

test("search results show the map", async () => {
  jest.useFakeTimers();

  await renderPage();

  await searchForClinic();

  await waitFor(() => {
    expect(screen.getByTestId("clinic-map")).toBeInTheDocument();
  });
});

test("selecting clinic loads queue", async () => {
  jest.useFakeTimers();

  getTodayQueueForClinic.mockResolvedValue([{ id: "a", status: "waiting" }]);
  getMyQueueEntryForClinic.mockResolvedValue(null);

  await renderPage();

  await searchForClinic();

  fireEvent.click(await screen.findByText(/Select Clinic/i));

  await waitFor(() => {
    expect(getTodayQueueForClinic).toHaveBeenCalledWith("1");
    expect(getMyQueueEntryForClinic).toHaveBeenCalledWith("1");
    expect(screen.getByText(/Queue hours/i)).toBeInTheDocument();
    expect(screen.getByText(/Current queue length/i)).toBeInTheDocument();
  });
});

test("join queue success shows popup", async () => {
  jest.useFakeTimers();

  getTodayQueueForClinic.mockResolvedValue([]);
  getMyQueueEntryForClinic.mockResolvedValue(null);
  getMyActiveQueueStatusForToday.mockResolvedValue(null);

  await renderPage();

  await searchForClinic();

  fireEvent.click(await screen.findByText(/Select Clinic/i));

  await waitFor(() => {
    expect(screen.getByText(/Join Queue/i)).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText(/Join Queue/i));

  await waitFor(() => {
    expect(joinQueue).toHaveBeenCalledWith("1");
    expect(screen.getByText(/Queue Joined Successfully/i)).toBeInTheDocument();
  });
});

test("blocked join queue shows popup", async () => {
  jest.useFakeTimers();

  getTodayQueueForClinic.mockResolvedValue([]);
  getMyQueueEntryForClinic.mockResolvedValue(null);

  getMyActiveQueueStatusForToday.mockResolvedValue({
    entry: { clinic_id: "999" },
    clinic: { facility_name: "Other Clinic" },
    position: 3,
    estimatedWait: 30,
  });

  await renderPage();

  await searchForClinic();

  fireEvent.click(await screen.findByText(/Select Clinic/i));

  await waitFor(() => {
    expect(screen.getByText(/Join Queue/i)).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText(/Join Queue/i));

  await waitFor(() => {
    expect(screen.getByText(/Already in a Queue/i)).toBeInTheDocument();
    expect(screen.getByText(/Other Clinic/i)).toBeInTheDocument();
  });
});

test("leave queue works", async () => {
  jest.useFakeTimers();

  getTodayQueueForClinic.mockResolvedValue([{ id: "q1", status: "waiting" }]);

  getMyQueueEntryForClinic.mockResolvedValue({
    id: "q1",
    status: "waiting",
  });

  await renderPage();

  await searchForClinic();

  fireEvent.click(await screen.findByText(/Select Clinic/i));

  await waitFor(() => {
    expect(screen.getByText(/Leave Queue/i)).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText(/Leave Queue/i));

  await waitFor(() => {
    expect(leaveQueue).toHaveBeenCalledWith("q1");
    expect(screen.getByText(/You have left the queue/i)).toBeInTheDocument();
  });
});

test("navigates after closing success popup", async () => {
  jest.useFakeTimers();

  getTodayQueueForClinic.mockResolvedValue([]);
  getMyQueueEntryForClinic.mockResolvedValue(null);
  getMyActiveQueueStatusForToday.mockResolvedValue(null);

  await renderPage();

  await searchForClinic();

  fireEvent.click(await screen.findByText(/Select Clinic/i));

  await waitFor(() => {
    expect(screen.getByText(/Join Queue/i)).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText(/Join Queue/i));

  await waitFor(() => {
    expect(screen.getByText(/Go to Dashboard/i)).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText(/Go to Dashboard/i));

  expect(navigateMock).toHaveBeenCalledWith("/patient");
});