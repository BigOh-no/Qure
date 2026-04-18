import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StaffDashboard from "../pages/Staff-dashboard";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("StaffDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders dashboard and patient list", () => {
    render(
      <MemoryRouter>
        <StaffDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/staff dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
  });

  test("updates patient status to In Consultation when Start is clicked", async () => {
    render(
      <MemoryRouter>
        <StaffDashboard />
      </MemoryRouter>
    );

    const user = userEvent;

    const startButtons = screen.getAllByText(/start/i);
    await user.click(startButtons[0]);

    expect(
      screen.getAllByText(/in consultation/i).length
    ).toBeGreaterThan(0);
  });

  test("updates patient status to Complete when Complete is clicked", async () => {
    render(
      <MemoryRouter>
        <StaffDashboard />
      </MemoryRouter>
    );

    const user = userEvent;

    const completeButtons = screen.getAllByText(/complete/i);
    await user.click(completeButtons[0]);

    expect(screen.getAllByText(/complete/i).length).toBeGreaterThan(0);
  });

  test("shows correct patient count", () => {
    render(
      <MemoryRouter>
        <StaffDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/3 patients/i)).toBeInTheDocument();
  });

  test("navigates to home on logout", async () => {
    render(
      <MemoryRouter>
        <StaffDashboard />
      </MemoryRouter>
    );

    const user = userEvent;

    await user.click(screen.getByText(/logout/i));

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});