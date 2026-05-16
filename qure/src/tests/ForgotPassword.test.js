// ForgotPassword.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ForgotPassword from "../pages/ForgotPassword";

// Mock supabase client
jest.mock("../lib/supabaseClient", () => ({
  supabaseClient: {
    auth: {
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

import { supabaseClient } from "../lib/supabaseClient";

describe("ForgotPassword Component", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("does not render when isOpen is false", () => {
    const { container } = render(
      <ForgotPassword isOpen={false} onClose={mockOnClose} />
    );

    expect(container.firstChild).toBeNull();
  });

  test("renders modal when isOpen is true", () => {
    render(<ForgotPassword isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText("Reset Password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your email")).toBeInTheDocument();
  });

  test("shows validation message when email is empty", async () => {
    render(<ForgotPassword isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(
      screen.getByText("Please enter your email address.")
    ).toBeInTheDocument();
  });

  test("submits successfully and shows success message", async () => {
    supabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
      error: null,
    });

    render(<ForgotPassword isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText("Enter your email");

    fireEvent.change(input, {
      target: { value: "test@example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(
        supabaseClient.auth.resetPasswordForEmail
      ).toHaveBeenCalledWith("test@example.com", {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText("Check your email for the reset link.")
      ).toBeInTheDocument();
    });

    expect(input.value).toBe("");
  });

  test("shows error message when supabase returns an error", async () => {
    supabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
      error: {
        message: "User not found",
      },
    });

    render(<ForgotPassword isOpen={true} onClose={mockOnClose} />);

    fireEvent.change(screen.getByPlaceholderText("Enter your email"), {
      target: { value: "wrong@example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText("User not found")).toBeInTheDocument();
    });
  });

  test("disables buttons while sending", async () => {
    let resolvePromise;

    supabaseClient.auth.resetPasswordForEmail.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    render(<ForgotPassword isOpen={true} onClose={mockOnClose} />);

    fireEvent.change(screen.getByPlaceholderText("Enter your email"), {
      target: { value: "test@example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(
      screen.getByRole("button", { name: /sending/i })
    ).toBeDisabled();

    expect(screen.getByRole("button", { name: /close/i })).toBeDisabled();

    resolvePromise({ error: null });

    await waitFor(() => {
      expect(
        screen.getByText("Check your email for the reset link.")
      ).toBeInTheDocument();
    });
  });

  test("calls onClose when close button is clicked", () => {
    render(<ForgotPassword isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByRole("button", { name: /close/i }));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test("calls onClose when overlay is clicked", () => {
    const { container } = render(
      <ForgotPassword isOpen={true} onClose={mockOnClose} />
    );

    const overlay = container.querySelector(".admin-modal-overlay");

    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test("does not close when dialog content is clicked", () => {
    render(<ForgotPassword isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByRole("dialog"));

    expect(mockOnClose).not.toHaveBeenCalled();
  });
});