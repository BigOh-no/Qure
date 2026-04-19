import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResetPasswordPage from "../pages/resetPasswordPage";
import { MemoryRouter } from "react-router-dom";

import {
  updatePassword,
  ensureUserProfile,
  getUserRole,
} from "../lib/auth";

import { supabaseClient } from "../lib/supabaseClient";

// ---------------- MOCKS ----------------
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../lib/auth", () => ({
  updatePassword: jest.fn(),
  ensureUserProfile: jest.fn(),
  getUserRole: jest.fn(),
}));

jest.mock("../lib/supabaseClient", () => ({
  supabaseClient: {
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    supabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: { unsubscribe: jest.fn() },
      },
    });
  });

  // ---------------- RENDER + SESSION ----------------
  test("shows verifying state initially", async () => {
    supabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/verifying your invite link/i)
    ).toBeInTheDocument();
  });

  test("shows error when session is missing", async () => {
    supabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/invite session is missing/i)
    ).toBeInTheDocument();
  });

  test("enables form when session exists", async () => {
    supabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "1" } } },
      error: null,
    });

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    expect(
      await screen.findByLabelText(/new password/i)
    ).toBeInTheDocument();
  });

  // ---------------- FORM VALIDATION ----------------
  test("validates password length", async () => {
    supabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "1" } } },
      error: null,
    });

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    await userEvent.type(
      await screen.findByLabelText(/new password/i),
      "123"
    );

    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      "123"
    );

    await userEvent.click(
      screen.getByRole("button", { name: /update password/i })
    );

    expect(
      screen.getByText(/at least 6 characters/i)
    ).toBeInTheDocument();
  });

  test("validates password mismatch", async () => {
    supabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "1" } } },
      error: null,
    });

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    await userEvent.type(
      await screen.findByLabelText(/new password/i),
      "password123"
    );

    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      "different123"
    );

    await userEvent.click(
      screen.getByRole("button", { name: /update password/i })
    );

    expect(
      screen.getByText(/passwords do not match/i)
    ).toBeInTheDocument();
  });

  // ---------------- SUCCESS FLOW ----------------
  test("updates password and navigates based on role", async () => {
    jest.useFakeTimers();

    supabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "1" } } },
      error: null,
    });

    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "1" } },
      error: null,
    });

    updatePassword.mockResolvedValue();
    ensureUserProfile.mockResolvedValue();
    getUserRole.mockResolvedValue("admin");

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    await userEvent.type(
      await screen.findByLabelText(/new password/i),
      "password123"
    );

    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      "password123"
    );

    await userEvent.click(
      screen.getByRole("button", { name: /update password/i })
    );

    expect(
      await screen.findByText(/password updated successfully/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(updatePassword).toHaveBeenCalledWith("password123");
      expect(ensureUserProfile).toHaveBeenCalled();
      expect(getUserRole).toHaveBeenCalled();
    });

    jest.advanceTimersByTime(1200);

    expect(mockNavigate).toHaveBeenCalledWith("/admin", {
      replace: true,
    });

    jest.useRealTimers();
  });

  // ---------------- ERROR FLOW ----------------
  test("shows error if updatePassword fails", async () => {
    supabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "1" } } },
      error: null,
    });

    updatePassword.mockRejectedValue(new Error("Update failed"));

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    await userEvent.type(
      await screen.findByLabelText(/new password/i),
      "password123"
    );

    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      "password123"
    );

    await userEvent.click(
      screen.getByRole("button", { name: /update password/i })
    );

    expect(
      await screen.findByText(/update failed/i)
    ).toBeInTheDocument();
  });
});