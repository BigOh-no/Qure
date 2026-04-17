import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BookAppointment from "../pages/BookAppointment";

import { searchClinics } from "../pages/clinicService";
import { getBookedSlots, createAppointment } from "../pages/appointmentService";
import { generateHourlySlots } from "../pages/slotUtils";

// ---------------- MOCK ROUTER ----------------
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
}));

// ---------------- MOCK MAP ----------------
jest.mock("../pages/ClinicMap.js", () => () => (
  <div data-testid="clinic-map">Map</div>
));

// ---------------- TEST HELPER ----------------
const renderComponent = () =>
  render(
    <MemoryRouter>
      <BookAppointment />
    </MemoryRouter>
  );

// ---------------- TESTS ----------------
describe("BookAppointment", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    generateHourlySlots.mockReturnValue([
      "09:00",
      "10:00",
      "11:00",
    ]);

    searchClinics.mockResolvedValue([
      {
        id: "c1",
        facility_name: "Test Clinic",
        admin1: "Gauteng",
        facility_type: "Clinic",
      },
    ]);

    getBookedSlots.mockResolvedValue(["10:00"]);
  });

  test("renders page title", () => {
    renderComponent();

    expect(
      screen.getByText(/book appointment/i)
    ).toBeInTheDocument();
  });

  test("searches and displays clinics", async () => {
    renderComponent();

    const input = screen.getByLabelText(/search clinic name/i);

    fireEvent.change(input, { target: { value: "test" } });

    expect(await screen.findByText(/test clinic/i)).toBeInTheDocument();
  });

  test("selecting a clinic shows booking section", async () => {
    renderComponent();

    fireEvent.change(screen.getByLabelText(/search clinic name/i), {
      target: { value: "test" },
    });

    const selectBtn = await screen.findByRole("button", {
      name: /select clinic/i,
    });

    fireEvent.click(selectBtn);

    expect(
      await screen.findByText(/selected clinic/i)
    ).toBeInTheDocument();
  });

  test("shows slots after selecting date", async () => {
    renderComponent();

    fireEvent.change(screen.getByLabelText(/search clinic name/i), {
      target: { value: "test" },
    });

    const selectBtn = await screen.findByRole("button", {
      name: /select clinic/i,
    });

    fireEvent.click(selectBtn);

    const dateInput = await screen.findByLabelText(/date/i);

    fireEvent.change(dateInput, {
      target: { value: "2099-01-01" },
    });

    await waitFor(() => {
      expect(generateHourlySlots).toHaveBeenCalled();
    });
  });

  test("book appointment success flow", async () => {
    createAppointment.mockResolvedValueOnce({});

    renderComponent();

    // search clinic
    fireEvent.change(screen.getByLabelText(/search clinic name/i), {
      target: { value: "test" },
    });

    const selectBtn = await screen.findByRole("button", {
      name: /select clinic/i,
    });

    fireEvent.click(selectBtn);

    // set date
    const dateInput = await screen.findByLabelText(/date/i);
    fireEvent.change(dateInput, {
      target: { value: "2099-01-01" },
    });

    // wait for slots
    await waitFor(() => {
      expect(screen.getByText("09:00")).toBeInTheDocument();
    });

    // pick slot
    fireEvent.click(screen.getByText("09:00"));

    // confirm booking
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

  test("prevents booking without clinic selection", async () => {
        renderComponent();

        expect(
            screen.queryByRole("button", { name: /confirm/i })
        ).not.toBeInTheDocument();

        expect(
            screen.queryByText(/please select a clinic first/i)
        ).not.toBeInTheDocument();
    });
});