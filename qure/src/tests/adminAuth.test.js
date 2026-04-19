import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import AdminAuth from "../pages/adminAuth";
import { MemoryRouter } from "react-router-dom";

import { supabaseClient } from "../lib/supabaseClient";

// ---------------- MOCKS ----------------
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../lib/supabaseClient", () => ({
  supabaseClient: {
    auth: {
      verifyOtp: jest.fn(),
    },
  },
}));

// Helper to set URL params
const setSearch = (search) => {
  delete window.location;
  window.location = { search };
};

describe("AdminAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------- INITIAL RENDER ----------------
  test("shows initial verifying message", () => {
    setSearch("?token_hash=abc&type=signup");

    render(
      <MemoryRouter>
        <AdminAuth />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/verifying your invite link/i)
    ).toBeInTheDocument();
  });

  // ---------------- INVALID LINK ----------------
  test("shows invalid link message when params are missing", async () => {
    setSearch("");

    render(
      <MemoryRouter>
        <AdminAuth />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/invalid invite link/i)
    ).toBeInTheDocument();
  });

  // ---------------- OTP FAILURE ----------------
  test("shows error when verifyOtp fails", async () => {
    setSearch("?token_hash=abc&type=signup");

    supabaseClient.auth.verifyOtp.mockResolvedValue({
      error: new Error("OTP failed"),
    });

    render(
      <MemoryRouter>
        <AdminAuth />
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
        <AdminAuth />
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

  // ---------------- EDGE CASE ----------------
  test("handles thrown exceptions", async () => {
    setSearch("?token_hash=abc&type=signup");

    supabaseClient.auth.verifyOtp.mockRejectedValue(
      new Error("Network crash")
    );

    render(
      <MemoryRouter>
        <AdminAuth />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/network crash/i)
    ).toBeInTheDocument();
  });
});