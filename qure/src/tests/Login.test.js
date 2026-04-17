import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "../pages/Login";

// ✅ Mock auth functions
jest.mock("../lib/auth", () => ({
  login: jest.fn(),
  loginGoogle: jest.fn(),
  getUserRole: jest.fn(),
}));

import { login, loginGoogle, getUserRole } from "../lib/auth";

// ✅ MOCK react-router-dom (IMPORTANT FIX)
const mockNavigate = jest.fn();

jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => mockNavigate,
    Link: ({ children }) => <span>{children}</span>,
  }),
  { virtual: true }
);

// Mock ForgotPassword component
jest.mock("../pages/ForgotPassword", () => () => (
  <div data-testid="forgot-password">Forgot Password Component</div>
));

describe("Login Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => render(<Login />);

  test("renders login form", () => {
    renderComponent();

    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  test("shows error if fields are empty", async () => {
    renderComponent();

    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(
      await screen.findByText(/please fill in all fields/i)
    ).toBeInTheDocument();
  });

  test("updates input fields", () => {
    renderComponent();

    const emailInput = screen.getByPlaceholderText(/email address/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    fireEvent.change(emailInput, {
      target: { value: "test@mail.com" },
    });

    fireEvent.change(passwordInput, {
      target: { value: "123456" },
    });

    expect(emailInput.value).toBe("test@mail.com");
    expect(passwordInput.value).toBe("123456");
  });

  test("toggles password visibility", () => {
    renderComponent();

    const passwordInput = screen.getByPlaceholderText(/password/i);

    expect(passwordInput.type).toBe("password");

    const toggle = document.querySelector(".eye-icon");
    fireEvent.click(toggle);

    expect(passwordInput.type).toBe("text");
  });

  test("successful login redirects patient", async () => {
    login.mockResolvedValue({ email: "test@mail.com" });
    getUserRole.mockResolvedValue("patient");

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: "test@mail.com" },
    });

    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/patient");
    });
  });

  test("successful login redirects admin", async () => {
    login.mockResolvedValue({ email: "admin@mail.com" });
    getUserRole.mockResolvedValue("admin");

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: "admin@mail.com" },
    });

    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/admin");
    });
  });

  test("successful login redirects clinic staff", async () => {
    login.mockResolvedValue({ email: "staff@mail.com" });
    getUserRole.mockResolvedValue("clinicstaff");

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: "staff@mail.com" },
    });

    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/staff");
    });
  });

  test("redirects to default route if role unknown", async () => {
    login.mockResolvedValue({ email: "unknown@mail.com" });
    getUserRole.mockResolvedValue("unknown");

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: "unknown@mail.com" },
    });

    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  test("shows error on login failure", async () => {
    login.mockRejectedValue(new Error("Invalid credentials"));

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: "test@mail.com" },
    });

    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: "wrongpass" },
    });

    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(
      await screen.findByText(/invalid credentials/i)
    ).toBeInTheDocument();
  });

  test("calls Google login", async () => {
    loginGoogle.mockResolvedValue();

    renderComponent();

    fireEvent.click(screen.getByText(/continue with google/i));

    await waitFor(() => {
      expect(loginGoogle).toHaveBeenCalled();
    });
  });

  test("shows forgot password component", () => {
    renderComponent();

    fireEvent.click(
      screen.getByRole("link", { name: /forgot password/i })
    );

    expect(screen.getByTestId("forgot-password")).toBeInTheDocument();
  });
});