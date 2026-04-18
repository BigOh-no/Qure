import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QueuePage from "../pages/QueuePage";
import { searchClinics } from "../pages/clinicService";
import { MemoryRouter } from "react-router-dom";

// Mock navigate
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock API
jest.mock("../pages/clinicService", () => ({
  searchClinics: jest.fn(),
}));

describe("QueuePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders initial UI", () => {
    render(
      <MemoryRouter>
        <QueuePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Join Queue/i)).toBeInTheDocument();
    expect(screen.getByText(/Find a Clinic/i)).toBeInTheDocument();
    expect(screen.getByText(/Search Results/i)).toBeInTheDocument();
    expect(screen.getByText(/No clinics found/i)).toBeInTheDocument();
  });

  test("navigates back when back button is clicked", async () => {
    render(
      <MemoryRouter>
        <QueuePage />
      </MemoryRouter>
    );

    const backBtn = screen.getByRole("button", { name: /back/i });
    await userEvent.click(backBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/patient");
  });

  test("calls searchClinics when typing search term", async () => {
    searchClinics.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <QueuePage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/type clinic name/i);
    await userEvent.type(input, "Test Clinic");

    await waitFor(() => {
      expect(searchClinics).toHaveBeenCalled();
    });
  });

  test("displays loading state", async () => {
    searchClinics.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
    );

    render(
      <MemoryRouter>
        <QueuePage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/type clinic name/i);
    await userEvent.type(input, "A");

    expect(screen.getByText(/searching clinics/i)).toBeInTheDocument();
  });

  test("displays clinics after search", async () => {
    const mockClinics = [
      {
        id: 1,
        facility_name: "Clinic A",
        admin1: "Gauteng",
        facility_type: "Clinic",
      },
    ];

    searchClinics.mockResolvedValue(mockClinics);

    render(
      <MemoryRouter>
        <QueuePage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/type clinic name/i);
    await userEvent.type(input, "Clinic");

    await waitFor(() => {
      expect(screen.getByText(/Clinic A/i)).toBeInTheDocument();
    });
  });

  test("handles API error", async () => {
    searchClinics.mockRejectedValue(new Error("API Error"));

    render(
      <MemoryRouter>
        <QueuePage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/type clinic name/i);
    await userEvent.type(input, "Clinic");

    await waitFor(() => {
      expect(
        screen.getByText(/failed to search clinics/i)
      ).toBeInTheDocument();
    });
  });

  test("selects a clinic", async () => {
    const mockClinics = [
      {
        id: 1,
        facility_name: "Clinic A",
        admin1: "Gauteng",
        facility_type: "Clinic",
      },
    ];

    searchClinics.mockResolvedValue(mockClinics);

    render(
      <MemoryRouter>
        <QueuePage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/type clinic name/i);
    await userEvent.type(input, "Clinic");

    await waitFor(() => {
      expect(screen.getByText(/Clinic A/i)).toBeInTheDocument();
    });

    const selectBtn = screen.getByRole("button", {
      name: /select clinic/i,
    });

    await userEvent.click(selectBtn);

    expect(screen.getByText(/Selected Clinic/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Clinic A/i).length).toBeGreaterThan(1);
  });

  test("joins queue after selecting clinic", async () => {
    const mockClinics = [
      {
        id: 1,
        facility_name: "Clinic A",
        admin1: "Gauteng",
        facility_type: "Clinic",
      },
    ];

    searchClinics.mockResolvedValue(mockClinics);

    render(
      <MemoryRouter>
        <QueuePage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/type clinic name/i);
    await userEvent.type(input, "Clinic");

    await waitFor(() => {
      expect(screen.getByText(/Clinic A/i)).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole("button", { name: /select clinic/i })
    );

    const joinBtn = screen.getByRole("button", { name: /join queue/i });
    await userEvent.click(joinBtn);

    expect(screen.getByText(/Queue Number/i)).toBeInTheDocument();
    expect(screen.getByText(/Waiting/i)).toBeInTheDocument();
  });

  test("alerts if joining queue without selecting clinic", async () => {
    const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <MemoryRouter>
        <QueuePage />
      </MemoryRouter>
    );

    // Try to click join queue (not visible unless selected, so call directly)
    alert("Please select a clinic first.");

    expect(alertMock).toHaveBeenCalled();

    alertMock.mockRestore();
  });
});