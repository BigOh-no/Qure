import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AnalyticsPage from "../pages/analyticsPage";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabaseClient } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("react-router-dom", () => ({ useNavigate: jest.fn() }));
jest.mock("../styles/Admin.css", () => ({}));

jest.mock("jspdf", () => jest.fn());

jest.mock("jspdf-autotable", () => jest.fn());

jest.mock("../lib/supabaseClient", () => ({
  supabaseClient: { from: jest.fn() },
}));

function makeQuery({ data = [], error = null } = {}) {
  const result = Promise.resolve({ data, error });
  return {
    select: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    then: result.then.bind(result),
    catch: result.catch.bind(result),
  };
}

function setupMocks({ queueEntries = [], appointments = [] } = {}) {
  supabaseClient.from.mockImplementation((table) => {
    if (table === "queue_entries") return makeQuery({ data: queueEntries });
    if (table === "appointments") return makeQuery({ data: appointments });
    return makeQuery({ data: [] });
  });
}

function readBlobText(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}


const NOW = new Date("2024-06-15T14:30:00Z");

const pastDate = "2024-06-15";
const pastTime = "08:00:00";

const recentDate = "2024-06-16"; // tomorrow relative to NOW
const recentTime = "10:00:00";

function makeQueueEntry({
  id = 1,
  clinic_id = "c1",
  facility_name = "City Clinic",
  joined_at = "2024-06-15T08:00:00Z",
  started_at = "2024-06-15T08:30:00Z",
  status = "completed",
} = {}) {
  return { id, clinic_id, joined_at, started_at, status, clinics: { facility_name } };
}

function makeAppointment({
  id = 1,
  appointment_date = pastDate,
  appointment_time = pastTime,
  status = "booked",
} = {}) {
  return { id, appointment_date, appointment_time, status };
}

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
   jest.clearAllMocks();

  const freshInstance = {
    setFillColor: jest.fn(),
    setTextColor: jest.fn(),
    setFontSize: jest.fn(),
    rect: jest.fn(),
    roundedRect: jest.fn(),
    text: jest.fn(),
    save: jest.fn(),
    lastAutoTable: { finalY: 100 },
  };
  jsPDF.mockImplementation(() => freshInstance);
  jsPDF.__mockInstance = freshInstance;

  useNavigate.mockReturnValue(jest.fn());

  global.URL.createObjectURL = jest.fn().mockReturnValue("blob:mock");
  global.URL.revokeObjectURL = jest.fn();

  setupMocks();
});

afterEach(() => {
  delete global.URL.createObjectURL;
  delete global.URL.revokeObjectURL;
});

// ------ Tests -------

describe("AnalyticsPage", () => {

  describe("initial render", () => {
    it("shows a loading indicator before data resolves", () => {
      supabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        then: () => new Promise(() => {}), // never resolves
      }));
      render(<AnalyticsPage />);
      expect(screen.getByText(/loading analytics/i)).toBeInTheDocument();
    });

    it("renders the Analytics Dashboard heading after load", async () => {
      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText("Analytics Dashboard")).toBeInTheDocument()
      );
    });

    it("renders Export CSV and Export PDF buttons", async () => {
      render(<AnalyticsPage />);
      await waitFor(() => {
        expect(screen.getByText("Export CSV")).toBeInTheDocument();
        expect(screen.getByText("Export PDF")).toBeInTheDocument();
      });
    });

    it("renders the Back to Admin button", async () => {
      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText("Back to Admin")).toBeInTheDocument()
      );
    });
  });

  describe("navigation", () => {
    it("navigates to /admin when Back to Admin is clicked", async () => {
      const navigate = jest.fn();
      useNavigate.mockReturnValue(navigate);
      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText("Back to Admin")).toBeInTheDocument()
      );
      fireEvent.click(screen.getByText("Back to Admin"));
      expect(navigate).toHaveBeenCalledWith("/admin");
    });
  });

  describe("average wait times", () => {
    it("shows empty-state message when there are no queue entries", async () => {
      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText(/no wait-time data available yet/i)).toBeInTheDocument()
      );
    });

    it("displays wait time grouped by clinic and time of day", async () => {
      setupMocks({
        queueEntries: [
          makeQueueEntry({
            facility_name: "City Clinic",
            joined_at: "2024-06-15T08:00:00Z",
            started_at: "2024-06-15T08:45:00Z",
          }),
        ],
      });
      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText(/City Clinic/)).toBeInTheDocument()
      );
      expect(screen.getByText(/45 minutes/i)).toBeInTheDocument();
    });

    it("labels hours 6–11 as Morning", async () => {
      setupMocks({
        queueEntries: [
          makeQueueEntry({
            joined_at: "2024-06-15T09:00:00Z",
            started_at: "2024-06-15T09:20:00Z",
          }),
        ],
      });
      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText(/Morning/)).toBeInTheDocument()
      );
    });

    it("labels hours 12–16 as Afternoon", async () => {
      setupMocks({
        queueEntries: [
          makeQueueEntry({
            joined_at: "2024-06-15T13:00:00Z",
            started_at: "2024-06-15T13:30:00Z",
          }),
        ],
      });
      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText(/Afternoon/)).toBeInTheDocument()
      );
    });

    it("labels hours 17+ as Evening", async () => {
      setupMocks({
        queueEntries: [
          makeQueueEntry({
            joined_at: "2024-06-15T18:00:00Z",
            started_at: "2024-06-15T18:25:00Z",
          }),
        ],
      });
      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText(/Evening/)).toBeInTheDocument()
      );
    });

    it("averages multiple entries for the same clinic/time-of-day slot", async () => {
      setupMocks({
        queueEntries: [
          makeQueueEntry({
            id: 1,
            facility_name: "Midtown Medical",
            joined_at: "2024-06-15T09:00:00Z",
            started_at: "2024-06-15T09:20:00Z",
          }),
          makeQueueEntry({
            id: 2,
            facility_name: "Midtown Medical",
            joined_at: "2024-06-15T09:10:00Z",
            started_at: "2024-06-15T09:50:00Z",
          }),
        ],
      });
      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText(/30 minutes/i)).toBeInTheDocument()
      );
    });

    it("ignores entries where started_at is before joined_at (negative wait)", async () => {
      setupMocks({
        queueEntries: [
          makeQueueEntry({
            joined_at: "2024-06-15T10:00:00Z",
            started_at: "2024-06-15T09:00:00Z", // negative → filtered out
          }),
        ],
      });
      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText(/no wait-time data available yet/i)).toBeInTheDocument()
      );
    });

    it("falls back to 'Clinic <id>' when facility_name is missing", async () => {
      setupMocks({
        queueEntries: [
          {
            id: 99,
            clinic_id: "xyz",
            joined_at: "2024-06-15T08:00:00Z",
            started_at: "2024-06-15T08:10:00Z",
            status: "completed",
            clinics: null,
          },
        ],
      });
      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText(/Clinic xyz/)).toBeInTheDocument()
      );
    });
  });

  describe("no-show rate", () => {
    it("shows 0% when there are no eligible appointments", async () => {
      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText("0%")).toBeInTheDocument()
      );
    });

    it("calculates 100% when all eligible appointments are still 'booked'", async () => {
      setupMocks({
        appointments: [
          makeAppointment({ id: 1, status: "booked" }),
          makeAppointment({ id: 2, status: "booked" }),
        ],
      });
      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText("100%")).toBeInTheDocument()
      );
    });

    it("calculates 0% when all eligible appointments are 'checked_in'", async () => {
      setupMocks({
        appointments: [
          makeAppointment({ id: 1, status: "checked_in" }),
          makeAppointment({ id: 2, status: "checked_in" }),
        ],
      });
      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText("0%")).toBeInTheDocument()
      );
    });

    it("calculates 50% for 1 booked and 1 checked_in", async () => {
      setupMocks({
        appointments: [
          makeAppointment({ id: 1, status: "booked" }),
          makeAppointment({ id: 2, status: "checked_in" }),
        ],
      });
      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText("50%")).toBeInTheDocument()
      );
    });

    it("ignores appointments with missing date or time fields", async () => {
      setupMocks({
        appointments: [
          { id: 1, appointment_date: null, appointment_time: null, status: "booked" },
          makeAppointment({ id: 2, status: "booked" }),
        ],
      });
      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText("100%")).toBeInTheDocument()
      );
    });

    it("excludes appointments within 1 hour of now (not yet eligible)", async () => {
      setupMocks({
        appointments: [
          makeAppointment({
            id: 1,
            appointment_date: recentDate,
            appointment_time: recentTime,
            status: "booked",
          }),
        ],
      });
      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText("0%")).toBeInTheDocument()
      );
    });
  });

  describe("queue status summary", () => {
    it("displays all-zero counts when there are no entries", async () => {
      render(<AnalyticsPage />);
      await waitFor(() => {
        expect(screen.getByText(/Waiting: 0/i)).toBeInTheDocument();
        expect(screen.getByText(/Completed: 0/i)).toBeInTheDocument();
        expect(screen.getByText(/Cancelled: 0/i)).toBeInTheDocument();
        expect(screen.getByText(/Total Queue Entries: 0/i)).toBeInTheDocument();
      });
    });

    it("correctly counts each status category", async () => {
      setupMocks({
        queueEntries: [
          { id: 1, status: "waiting" },
          { id: 2, status: "waiting" },
          { id: 3, status: "completed" },
          { id: 4, status: "cancelled" },
          { id: 5, status: "completed" },
        ],
      });
      render(<AnalyticsPage />);
      await waitFor(() => {
        expect(screen.getByText(/Waiting: 2/i)).toBeInTheDocument();
        expect(screen.getByText(/Completed: 2/i)).toBeInTheDocument();
        expect(screen.getByText(/Cancelled: 1/i)).toBeInTheDocument();
        expect(screen.getByText(/Total Queue Entries: 5/i)).toBeInTheDocument();
      });
    });
  });

  describe("error handling", () => {
    beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => {}));
    afterEach(() => console.error.mockRestore());

    it("renders gracefully when queue_entries query errors", async () => {
      supabaseClient.from.mockImplementation((table) => {
        if (table === "queue_entries")
          return makeQuery({ data: null, error: { message: "DB error" } });
        return makeQuery({ data: [] });
      });
      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText("Analytics Dashboard")).toBeInTheDocument()
      );
      expect(console.error).toHaveBeenCalled();
    });

    it("renders gracefully when appointments query errors", async () => {
      supabaseClient.from.mockImplementation((table) => {
        if (table === "appointments")
          return makeQuery({ data: null, error: { message: "DB error" } });
        return makeQuery({ data: [] });
      });
      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText("Analytics Dashboard")).toBeInTheDocument()
      );
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("exportCSV", () => {
    let anchorClick;

    beforeEach(() => {
      anchorClick = jest
        .spyOn(HTMLAnchorElement.prototype, "click")
        .mockImplementation(() => {});
    });

    afterEach(() => {
      anchorClick.mockRestore();
    });

    it("creates a Blob and triggers a download on click", async () => {
      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText("Export CSV")).toBeInTheDocument()
      );
      fireEvent.click(screen.getByText("Export CSV"));

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(anchorClick).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
    });

    it("uses a filename matching qure-analytics-report-<date>.csv", async () => {
      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText("Export CSV")).toBeInTheDocument()
      );

      let capturedDownload = "";
      const origCreateElement = document.createElement.bind(document);
      jest.spyOn(document, "createElement").mockImplementation((tag) => {
        const el = origCreateElement(tag);
        if (tag === "a") {
          Object.defineProperty(el, "download", {
            set: (v) => { capturedDownload = v; },
            get: () => capturedDownload,
          });
        }
        return el;
      });

      fireEvent.click(screen.getByText("Export CSV"));
      expect(capturedDownload).toMatch(/qure-analytics-report-.+\.csv/);
      document.createElement.mockRestore();
    });

    it("includes wait-time data rows when entries exist", async () => {
      setupMocks({
        queueEntries: [
          makeQueueEntry({
            facility_name: "Northside Clinic",
            joined_at: "2024-06-15T09:00:00Z",
            started_at: "2024-06-15T09:30:00Z",
          }),
        ],
      });

      let capturedBlob;
      global.URL.createObjectURL = jest.fn().mockImplementation((blob) => {
        capturedBlob = blob;
        return "blob:mock";
      });

      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText(/Northside Clinic/)).toBeInTheDocument()
      );
      fireEvent.click(screen.getByText("Export CSV"));

      const text = await readBlobText(capturedBlob);
      expect(text).toContain("Northside Clinic");
      expect(text).toContain("30 minutes");
    });

    it("includes the empty-state placeholder when no wait-time entries", async () => {
      let capturedBlob;
      global.URL.createObjectURL = jest.fn().mockImplementation((blob) => {
        capturedBlob = blob;
        return "blob:mock";
      });

      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText("Export CSV")).toBeInTheDocument()
      );
      fireEvent.click(screen.getByText("Export CSV"));

      const text = await readBlobText(capturedBlob);
      expect(text).toContain("No wait-time data available yet.");
    });

  });

  describe("exportPDF", () => {
    it("calls jsPDF save with a correctly named file on click", async () => {
      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText("Export PDF")).toBeInTheDocument()
      );
      fireEvent.click(screen.getByText("Export PDF"));

      expect(jsPDF.__mockInstance.save).toHaveBeenCalledWith(
        expect.stringMatching(/qure-analytics-report-.+\.pdf/)
      );
    });

    it("calls autoTable exactly twice (wait times + queue summary)", async () => {
      setupMocks({
        queueEntries: [
          makeQueueEntry({
            facility_name: "East Side Clinic",
            joined_at: "2024-06-15T08:00:00Z",
            started_at: "2024-06-15T08:15:00Z",
          }),
        ],
      });
      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText("Export PDF")).toBeInTheDocument()
      );
      fireEvent.click(screen.getByText("Export PDF"));

      expect(autoTable).toHaveBeenCalledTimes(2);
    });

    it("passes empty-state placeholder to the wait-times autoTable call", async () => {
      render(<AnalyticsPage />);
      await waitFor(() =>
        expect(screen.getByText("Export PDF")).toBeInTheDocument()
      );
      fireEvent.click(screen.getByText("Export PDF"));

      const call = autoTable.mock.calls.find(
        (c) => c[1]?.head?.[0]?.includes("Average Wait Time")
      );
      expect(call).toBeDefined();
      expect(call[1].body[0][0]).toMatch(/No wait-time data available yet/);
    });

  });
});