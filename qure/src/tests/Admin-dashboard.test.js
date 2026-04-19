import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminDashboard from "../pages/Admin-dashboard";
import { MemoryRouter } from "react-router-dom";

import { logout, createAdminInvite } from "../lib/auth";
import { createClinicStaffInvite } from "../lib/adminService";
import { searchClinics } from "../pages/clinicService";

// 🔧 Mocks
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../lib/auth", () => ({
  logout: jest.fn(),
  createAdminInvite: jest.fn(),
}));

jest.mock("../lib/adminService", () => ({
  createClinicStaffInvite: jest.fn(),
}));

jest.mock("../pages/clinicService", () => ({
  searchClinics: jest.fn(),
}));

describe("AdminDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders dashboard basics", () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument();
    expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument();
  });

  test("logs out and navigates home", async () => {
    logout.mockResolvedValue();

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole("button", { name: /logout/i }));

    await waitFor(() => {
      expect(logout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  test("opens and closes Add Admin popup", async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await userEvent.click(screen.getByText(/Add Admin/i));

    expect(screen.getByText(/Save Admin/i)).toBeInTheDocument();

    await userEvent.click(screen.getByText(/Cancel/i));

    await waitFor(() => {
      expect(screen.queryByText(/Save Admin/i)).not.toBeInTheDocument();
    });
  });

  test("submits admin invite successfully", async () => {
    createAdminInvite.mockResolvedValue({});

    render(
        <MemoryRouter>
        <AdminDashboard />
        </MemoryRouter>
    );

    await userEvent.click(screen.getByText(/Add Admin/i));

    const input = screen.getByLabelText(/Email/i);
    await userEvent.type(input, "admin@test.com");

    await userEvent.click(
        screen.getByRole("button", { name: /save admin/i })
    );

    expect(
        await screen.findByText(/check their inbox/i)
    ).toBeInTheDocument();
    });

  test("opens Add Staff popup and searches clinics", async () => {
    searchClinics.mockResolvedValue([
      {
        id: 1,
        facility_name: "Clinic A",
        admin1: "Gauteng",
        facility_type: "Clinic",
      },
    ]);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await userEvent.click(screen.getByText(/Add Staff Member/i));

    const input = screen.getByPlaceholderText(/type clinic name/i);
    await userEvent.type(input, "Clinic");

    await waitFor(() => {
      expect(searchClinics).toHaveBeenCalled();
    });

    expect(await screen.findByText(/Clinic A/i)).toBeInTheDocument();
  });

  test("selects clinic and submits staff invite", async () => {
    searchClinics.mockResolvedValue([
      {
        id: 1,
        facility_name: "Clinic A",
        admin1: "Gauteng",
        facility_type: "Clinic",
      },
    ]);

    createClinicStaffInvite.mockResolvedValue({
      email: "staff@test.com",
    });

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await userEvent.click(screen.getByText(/Add Staff Member/i));

    await userEvent.type(
      screen.getByPlaceholderText(/type clinic name/i),
      "Clinic"
    );

    await waitFor(() => {
      expect(screen.getByText(/Clinic A/i)).toBeInTheDocument();
    });

    const selectButtons = screen.getAllByRole("button", {
        name: /select/i,
    });

    await userEvent.click(selectButtons[0]);

    await userEvent.type(
      screen.getByLabelText(/Email/i),
      "staff@test.com"
    );

    await userEvent.click(screen.getByRole("button", { name: /save staff/i }));

    await waitFor(() => {
      expect(createClinicStaffInvite).toHaveBeenCalledWith({
        email: "staff@test.com",
        clinicId: 1,
      });
    });

   expect(
    await screen.findByText(/invite sent/i)
    ).toBeInTheDocument();
  });

  test("prevents staff submit without selecting clinic", async () => {
    const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await userEvent.click(screen.getByText(/Add Staff Member/i));

    await userEvent.type(
      screen.getByLabelText(/Email/i),
      "staff@test.com"
    );

    await userEvent.click(screen.getByRole("button", { name: /save staff/i }));

    expect(alertMock).toHaveBeenCalledWith(
      "Please select a clinic first."
    );

    alertMock.mockRestore();
  });

  test("handles clinic search error", async () => {
    searchClinics.mockRejectedValue(new Error("API error"));

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await userEvent.click(screen.getByText(/Add Staff Member/i));

    await userEvent.type(
      screen.getByPlaceholderText(/type clinic name/i),
      "Clinic"
    );

    await waitFor(() => {
      expect(
        screen.getByText(/failed to search clinics/i)
      ).toBeInTheDocument();
    });
  });
});