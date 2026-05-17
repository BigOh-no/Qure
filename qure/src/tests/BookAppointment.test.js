import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BookAppointment from "../pages/BookAppointment";

import { searchClinics } from "../pages/clinicService";
import { getBookedSlots, createAppointment } from "../pages/appointmentService";
import {
  generateHourlySlots,
  isSlotWithinClinicHours,
  formatClinicHours,
} from "../pages/slotUtils";

// ---------------- MOCK NAVIGATION ----------------
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ---------------- MOCK SERVICES ----------------
jest.mock("../pages/clinicService", () => ({
  searchClinics: jest.fn(),
}));

jest.mock("../pages/appointmentService", () => ({
  getBookedSlots: jest.fn(),
  createAppointment: jest.fn(),
}));

jest.mock("../pages/slotUtils", () => ({
  generateHourlySlots: jest.fn(),
  isSlotWithinClinicHours: jest.fn(),
  formatClinicHours: jest.fn(() => "08:00 - 17:00"),
}));

// ---------------- MOCK MAP ----------------
jest.mock("../pages/ClinicMap.js", () => () => (
  <div data-testid="clinic-map">Map</div>
));

// ---------------- HELPERS ----------------
const renderComponent = () =>
  render(
    <MemoryRouter>
      <BookAppointment />
    </MemoryRouter>
  );

const mockClinic = {
  id: "c1",
  facility_name: "Test Clinic",
  admin1: "Gauteng",
  facility_type: "Clinic",
  open_t: "08:00",
  closed_t: "17:00",
};

// ---------------- TEST SETUP ----------------
beforeEach(() => {
  jest.clearAllMocks();

  generateHourlySlots.mockReturnValue(["09:00", "10:00"]);
  isSlotWithinClinicHours.mockReturnValue(true);

  searchClinics.mockResolvedValue([mockClinic]);
  getBookedSlots.mockResolvedValue(["10:00"]);
});

// ---------------- TESTS ----------------

describe("BookAppointment", () => {
  test("renders page title", () => {
    renderComponent();
    expect(screen.getByText(/book appointment/i)).toBeInTheDocument();
  });

  test("search triggers clinic results", async () => {
    renderComponent();

    fireEvent.change(screen.getByLabelText(/search clinic name/i), {
      target: { value: "test" },
    });

    expect(await screen.findByText(/test clinic/i)).toBeInTheDocument();
    expect(searchClinics).toHaveBeenCalled();
  });

  test("selecting a clinic shows selected clinic section", async () => {
    renderComponent();

    fireEvent.change(screen.getByLabelText(/search clinic name/i), {
      target: { value: "test" },
    });

    fireEvent.click(
      await screen.findByRole("button", { name: /select clinic/i })
    );

    expect(await screen.findByText(/selected clinic/i)).toBeInTheDocument();
  });

  test("loads and displays slots after date selection", async () => {
    renderComponent();

    fireEvent.change(screen.getByLabelText(/search clinic name/i), {
      target: { value: "test" },
    });

    fireEvent.click(
      await screen.findByRole("button", { name: /select clinic/i })
    );

    fireEvent.change(await screen.findByLabelText(/date/i), {
      target: { value: "2099-01-01" },
    });

    await waitFor(() => {
      expect(generateHourlySlots).toHaveBeenCalledWith(
        "08:00",
        "17:00",
        true
      );
    });

    expect(await screen.findByText("09:00")).toBeInTheDocument();
  });

  test("successfully books an appointment", async () => {
    createAppointment.mockResolvedValueOnce({});

    renderComponent();

    fireEvent.change(screen.getByLabelText(/search clinic name/i), {
      target: { value: "test" },
    });

    fireEvent.click(
      await screen.findByRole("button", { name: /select clinic/i })
    );

    fireEvent.change(await screen.findByLabelText(/date/i), {
      target: { value: "2099-01-01" },
    });

    await screen.findByText("09:00");

    fireEvent.click(screen.getByText("09:00"));

    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    await waitFor(() => {
      expect(createAppointment).toHaveBeenCalledWith({
        clinicId: "c1",
        appointmentDate: "2099-01-01",
        appointmentTime: "09:00",
      });
    });

    expect(
      await screen.findByText(/appointment booked successfully/i)
    ).toBeInTheDocument();
  });

  test("shows error when booking fails", async () => {
    createAppointment.mockRejectedValueOnce(new Error("Server error"));

    renderComponent();

    fireEvent.change(screen.getByLabelText(/search clinic name/i), {
      target: { value: "test" },
    });

    fireEvent.click(
      await screen.findByRole("button", { name: /select clinic/i })
    );

    fireEvent.change(await screen.findByLabelText(/date/i), {
      target: { value: "2099-01-01" },
    });

    await screen.findByText("09:00");

    fireEvent.click(screen.getByText("09:00"));
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(
      await screen.findByText(/server error/i)
    ).toBeInTheDocument();
  });

  test("prevents booking without selecting slot", async () => {
    renderComponent();

    fireEvent.change(screen.getByLabelText(/search clinic name/i), {
      target: { value: "test" },
    });

    fireEvent.click(
      await screen.findByRole("button", { name: /select clinic/i })
    );

    fireEvent.change(await screen.findByLabelText(/date/i), {
      target: { value: "2099-01-01" },
    });

    await screen.findByText("09:00");

    const confirmBtn = screen.getByRole("button", { name: /confirm/i });

    expect(confirmBtn).toBeDisabled();
  });

  test("navigates after closing success popup", async () => {
    createAppointment.mockResolvedValueOnce({});

    renderComponent();

    fireEvent.change(screen.getByLabelText(/search clinic name/i), {
      target: { value: "test" },
    });

    fireEvent.click(
      await screen.findByRole("button", { name: /select clinic/i })
    );

    fireEvent.change(await screen.findByLabelText(/date/i), {
      target: { value: "2099-01-01" },
    });

    await screen.findByText("09:00");

    fireEvent.click(screen.getByText("09:00"));
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    const okButton = await screen.findByRole("button", { name: /ok/i });

    fireEvent.click(okButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/patient");
    });
  });
});