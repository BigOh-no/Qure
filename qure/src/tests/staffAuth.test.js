import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import StaffPassword from "../pages/staffAuth";
import { MemoryRouter } from "react-router-dom";

import { supabaseClient } from "../lib/supabaseClient";
import { ensureUserProfile } from "../lib/auth";

// ---------------- MOCK NAVIGATION ----------------
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// ---------------- MOCK SUPABASE ----------------
jest.mock("../lib/supabaseClient", () => ({
  supabaseClient: {
    auth: {
      signOut: jest.fn(),
      verifyOtp: jest.fn(),
      getUser: jest.fn(),
    },
  },
}));

// ---------------- MOCK PROFILE ----------------
jest.mock("../lib/auth", () => ({
  ensureUserProfile: jest.fn(),
}));

// ---------------- HELPER: set URL ----------------
const setSearch = (search) => {
  delete window.location;
  window.location = { search };
};

describe("StaffPassword", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // default happy mocks
    supabaseClient.auth.signOut.mockResolvedValue({});
    supabaseClient.auth.verifyOtp.mockResolvedValue({ error: null });
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "123" } },
      error: null,
    });
    ensureUserProfile.mockResolvedValue({});
  });

  // ---------------- INITIAL STATE ----------------
  test("shows verifying message initially", async () => {
    setSearch("?token_hash=abc&type=signup");

    // delay signOut so initial state is visible
    supabaseClient.auth.signOut.mockImplementation(
      () => new Promise(() => {})
    );

    render(
      <MemoryRouter>
        <StaffPassword />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/verifying your invite link/i)
    ).toBeInTheDocument();
  });

  // ---------------- INVALID LINK ----------------
  test("shows invalid link when params are missing", async () => {
    setSearch("");

    render(
      <MemoryRouter>
        <StaffPassword />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/invalid invite link/i)
    ).toBeInTheDocument();
  });

  // ---------------- OTP FAILURE ----------------
  test("shows error message when verifyOtp fails", async () => {
    setSearch("?token_hash=abc&type=signup");

    supabaseClient.auth.verifyOtp.mockResolvedValue({
      error: new Error("OTP failed"),
    });

    render(
      <MemoryRouter>
        <StaffPassword />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/otp failed/i)
    ).toBeInTheDocument();
  });

  // ---------------- SUCCESS FLOW ----------------
  test("navigates to reset-password on success", async () => {
    setSearch("?token_hash=abc&type=signup");

    render(
      <MemoryRouter>
        <StaffPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(supabaseClient.auth.verifyOtp).toHaveBeenCalledWith({
        token_hash: "abc",
        type: "signup",
      });

      expect(ensureUserProfile).toHaveBeenCalled();

      expect(mockNavigate).toHaveBeenCalledWith(
        "/reset-password",
        { replace: true }
      );
    });
  });

  // ---------------- EXCEPTION HANDLING ----------------
  test("handles thrown errors gracefully", async () => {
    setSearch("?token_hash=abc&type=signup");

    supabaseClient.auth.verifyOtp.mockRejectedValue(
      new Error("Network error")
    );

    render(
      <MemoryRouter>
        <StaffPassword />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/network error/i)
    ).toBeInTheDocument();
  });
});