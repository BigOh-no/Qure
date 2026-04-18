import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import AuthCallback from "../pages/AuthCallback";
import { MemoryRouter } from "react-router-dom";

import { supabaseClient } from "../lib/supabaseClient";
import { ensureUserProfile, getUserRole } from "../lib/auth";

// ---------------- MOCK NAVIGATION ----------------
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// ---------------- MOCK DEPENDENCIES ----------------
jest.mock("../lib/supabaseClient", () => ({
  supabaseClient: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock("../lib/auth", () => ({
  ensureUserProfile: jest.fn(),
  getUserRole: jest.fn(),
}));

describe("AuthCallback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------- RENDER ----------------
  test("renders loading text", () => {
    render(
      <MemoryRouter>
        <AuthCallback />
      </MemoryRouter>
    );

    expect(screen.getByText(/logging in/i)).toBeInTheDocument();
  });

  // ---------------- PATIENT FLOW ----------------
  test("redirects patient user to /patient", async () => {
    supabaseClient.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { email: "patient@test.com", id: "1" },
        },
      },
      error: null,
    });

    ensureUserProfile.mockResolvedValue();
    getUserRole.mockResolvedValue("patient");

    render(
      <MemoryRouter>
        <AuthCallback />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/patient");
    });
  });

  // ---------------- ADMIN FLOW ----------------
  test("redirects admin user to /admin", async () => {
    supabaseClient.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { email: "admin@test.com", id: "2" },
        },
      },
      error: null,
    });

    ensureUserProfile.mockResolvedValue();
    getUserRole.mockResolvedValue("admin");

    render(
      <MemoryRouter>
        <AuthCallback />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/admin");
    });
  });

  // ---------------- STAFF FLOW ----------------
  test("redirects clinic staff to /staff", async () => {
    supabaseClient.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { email: "staff@test.com", id: "3" },
        },
      },
      error: null,
    });

    ensureUserProfile.mockResolvedValue();
    getUserRole.mockResolvedValue("clinicstaff");

    render(
      <MemoryRouter>
        <AuthCallback />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/staff");
    });
  });

  // ---------------- DEFAULT FLOW ----------------
  test("redirects unknown role to home", async () => {
    supabaseClient.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { email: "unknown@test.com", id: "4" },
        },
      },
      error: null,
    });

    ensureUserProfile.mockResolvedValue();
    getUserRole.mockResolvedValue("something_else");

    render(
      <MemoryRouter>
        <AuthCallback />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  // ---------------- ERROR FLOW ----------------
  test("redirects to login on error", async () => {
    supabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: new Error("Session error"),
    });

    render(
      <MemoryRouter>
        <AuthCallback />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });
});