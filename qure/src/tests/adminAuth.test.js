// AdminAuth.test.jsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import AdminAuth from "../pages/adminAuth"
import { supabaseClient } from "../lib/supabaseClient";
import { ensureUserProfile } from "../lib/auth";
import { MemoryRouter } from "react-router-dom";

// Mock navigate
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock supabase + auth helper
jest.mock("../lib/supabaseClient", () => ({
  supabaseClient: {
    auth: {
      signOut: jest.fn(),
      verifyOtp: jest.fn(),
      getUser: jest.fn(),
    },
  },
}));

jest.mock("../lib/auth", () => ({
  ensureUserProfile: jest.fn(),
}));

describe("AdminAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setSearch = (search) => {
    delete window.location;
    window.location = { search };
  };

  test("shows invalid link message if params missing", async () => {
    setSearch("");

    render(
      <MemoryRouter>
        <AdminAuth />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/invalid invite link/i)
      ).toBeInTheDocument();
    });
  });

  test("shows error if verifyOtp fails", async () => {
    setSearch("?token_hash=abc&type=invite");

    supabaseClient.auth.verifyOtp.mockResolvedValue({
      error: { message: "Invalid token" },
    });

    render(
      <MemoryRouter>
        <AdminAuth />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/invalid token/i)).toBeInTheDocument();
    });
  });

  test("shows error if user cannot be loaded", async () => {
    setSearch("?token_hash=abc&type=invite");

    supabaseClient.auth.verifyOtp.mockResolvedValue({ error: null });
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    render(
      <MemoryRouter>
        <AdminAuth />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/could not load invited admin user/i)
      ).toBeInTheDocument();
    });
  });

  test("successful flow navigates to reset-password", async () => {
    setSearch("?token_hash=abc&type=invite");

    const mockUser = { id: "123" };

    supabaseClient.auth.verifyOtp.mockResolvedValue({ error: null });
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    ensureUserProfile.mockResolvedValue({});

    render(
      <MemoryRouter>
        <AdminAuth />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(ensureUserProfile).toHaveBeenCalledWith(mockUser);
      expect(mockNavigate).toHaveBeenCalledWith("/reset-password", {
        replace: true,
      });
    });
  });

  test("handles unexpected error", async () => {
    setSearch("?token_hash=abc&type=invite");

    supabaseClient.auth.verifyOtp.mockRejectedValue(
      new Error("Something broke")
    );

    render(
      <MemoryRouter>
        <AdminAuth />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/something broke/i)
      ).toBeInTheDocument();
    });
  });
});