import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LandingPage from "../pages/Landing";

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
      <LandingPage />
    </MemoryRouter>
  );

// ---------------- TESTS ----------------
describe("LandingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders landing page content", () => {
    renderComponent();

    expect(screen.getByText(/welcome to qure/i)).toBeInTheDocument();
    expect(
      screen.getByText(/tired of waiting in long queues/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/beat the queue with qure/i)).toBeInTheDocument();
  });

  test("renders feature cards", () => {
    renderComponent();

    expect(screen.getByText(/no queues/i)).toBeInTheDocument();
    expect(screen.getByText(/fast/i)).toBeInTheDocument();
    expect(screen.getByText(/walk-ins/i)).toBeInTheDocument();
  });

  test("login button navigates to /Login", () => {
    renderComponent();

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/Login");
  });

  test("get started button navigates to /Signup", () => {
    renderComponent();

    fireEvent.click(screen.getByRole("button", { name: /get started/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/Signup");
  });

  test("footer renders", () => {
    renderComponent();

    expect(
      screen.getByText(/© 2026 qure. all rights reserved/i)
    ).toBeInTheDocument();
  });
});