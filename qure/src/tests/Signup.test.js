import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Signup from "../pages/Signup";
import { signUp, loginGoogle } from "../lib/auth";

// ---------------- MOCK AUTH ----------------
jest.mock("../lib/auth", () => ({
  signUp: jest.fn(),
  loginGoogle: jest.fn(),
}));

// ---------------- MOCK REACT ROUTER ----------------
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ---------------- TEST HELPER ----------------
const renderComponent = () =>
  render(
    <MemoryRouter>
      <Signup />
    </MemoryRouter>
  );

// ---------------- TESTS ----------------
describe("Signup Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders signup page", () => {
    renderComponent();

    expect(
      screen.getByRole("heading", { name: /create your qure account/i })
    ).toBeInTheDocument();
  });

  test("empty fields show error", async () => {
    renderComponent();

    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    expect(
      await screen.findByText(/please fill in all fields/i)
    ).toBeInTheDocument();
  });

  test("password mismatch error", async () => {
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/email@gmail.com/i), {
      target: { value: "test@mail.com" },
    });

    fireEvent.change(screen.getByPlaceholderText(/create password/i), {
      target: { value: "123456" },
    });

    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: "wrong" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    expect(
      await screen.findByText(/passwords do not match/i)
    ).toBeInTheDocument();
  });

  test("successful signup", async () => {
    signUp.mockResolvedValue({ email: "test@mail.com" });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/email@gmail.com/i), {
      target: { value: "test@mail.com" },
    });

    fireEvent.change(screen.getByPlaceholderText(/create password/i), {
      target: { value: "123456" },
    });

    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    expect(signUp).toHaveBeenCalledWith("test@mail.com", "123456");

    expect(
      await screen.findByText(/signup successful/i)
    ).toBeInTheDocument();
  });

  test("google signup works", () => {
    renderComponent();

    fireEvent.click(
      screen.getByRole("button", { name: /continue with google/i })
    );

    expect(loginGoogle).toHaveBeenCalled();
  });
});