import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import StaffAuth from "../pages/staffAuth";
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

describe("StaffAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // default success mock
    supabaseClient.auth.verifyOtp.mockResolvedValue({
      error: null,
    });
  });

  // ---------------- INITIAL STATE ----------------
  test("shows verifying message initially", async () => {
    setSearch("?token_hash=abc&type=signup");

    // delay verifyOtp so initial message is visible
    supabaseClient.auth.verifyOtp.mockImplementation(
      () => new Promise(() => {})
    );

    render(
      <MemoryRouter>
        <StaffAuth />
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
        <StaffAuth />
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
        <StaffAuth />
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
        <StaffAuth />
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
        <StaffAuth />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/network error/i)
    ).toBeInTheDocument();
  });
});