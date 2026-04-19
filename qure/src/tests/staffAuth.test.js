import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import StaffPassword from "../pages/staffAuth";
import { MemoryRouter } from "react-router-dom";

import { supabaseClient } from "../lib/supabaseClient";

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
      verifyOtp: jest.fn(),
    },
  },
}));

// ---------------- HELPER: set URL ----------------
const setSearch = (search) => {
  delete window.location;
  window.location = { search };
};

describe("StaffPassword", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------- INITIAL STATE ----------------
  test("shows verifying message initially", () => {
    setSearch("?token_hash=abc&type=signup");

    render(
      <MemoryRouter>
        <StaffPassword />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/verifying your invite link/i)
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

    supabaseClient.auth.verifyOtp.mockResolvedValue({
      error: null,
    });

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