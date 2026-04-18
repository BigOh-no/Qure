import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ForgotPassword from "../pages/ForgotPassword";

import { supabaseClient } from "../lib/supabaseClient";

// ---------------- MOCK SUPABASE ----------------
jest.mock("../lib/supabaseClient", () => ({
  supabaseClient: {
    auth: {
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

// ---------------- MOCK DIALOG METHODS ----------------
beforeEach(() => {
  jest.clearAllMocks();

  HTMLDialogElement.prototype.showModal = jest.fn();
  HTMLDialogElement.prototype.close = jest.fn();
});

describe("ForgotPassword", () => {
  // ---------------- RENDER OPEN ----------------
  test("opens dialog when isOpen is true", () => {
    render(
      <ForgotPassword isOpen={true} onClose={jest.fn()} email="test@example.com" />
    );

    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });

  // ---------------- RENDER CLOSE ----------------
  test("closes dialog when isOpen is false", () => {
    render(
      <ForgotPassword isOpen={false} onClose={jest.fn()} email="test@example.com" />
    );

    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
  });

  // ---------------- SUCCESS FLOW ----------------
  test("sends reset email successfully", async () => {
    supabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
      error: null,
    });

    render(
      <ForgotPassword isOpen={true} onClose={jest.fn()} email="test@example.com" />
    );

    fireEvent.click(screen.getByText(/send reset link/i));

    expect(
      await screen.findByText(/check your email for the reset link/i)
    ).toBeInTheDocument();

    expect(
      supabaseClient.auth.resetPasswordForEmail
    ).toHaveBeenCalledWith("test@example.com", {
      redirectTo: "http://localhost/reset-password",
    });
  });

  // ---------------- ERROR FLOW ----------------
  test("shows error message when reset fails", async () => {
    supabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
      error: new Error("Reset failed"),
    });

    render(
      <ForgotPassword isOpen={true} onClose={jest.fn()} email="test@example.com" />
    );

    fireEvent.click(screen.getByText(/send reset link/i));

    expect(await screen.findByText(/reset failed/i)).toBeInTheDocument();
  });

  // ---------------- CLOSE BUTTON ----------------
  test("calls onClose when close button is clicked", () => {
    const mockClose = jest.fn();

    render(
      <ForgotPassword
        isOpen={true}
        onClose={mockClose}
        email="test@example.com"
      />
    );

    fireEvent.click(screen.getByText(/close/i));

    expect(mockClose).toHaveBeenCalled();
  });
});