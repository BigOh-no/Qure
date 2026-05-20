import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import App from "../App";

jest.mock("leaflet", () => ({
  Icon: {
    Default: {
      prototype: {
        _getIconUrl: "mock-icon-url",
      },
      mergeOptions: jest.fn(),
    },
  },
}));

jest.mock("../pages/Landing", () => () => <div>Landing Page</div>);
jest.mock("../pages/Login", () => () => <div>Login Page</div>);
jest.mock("../pages/Signup", () => () => <div>Signup Page</div>);
jest.mock("../pages/Admin-dashboard", () => () => <div>Admin Dashboard</div>);
jest.mock("../pages/Patient-dashboard", () => () => <div>Patient Dashboard</div>);
jest.mock("../pages/AuthCallback", () => () => <div>Auth Callback</div>);
jest.mock("../pages/Staff-dashboard", () => () => <div>Staff Dashboard</div>);
jest.mock("../pages/BookAppointment", () => () => <div>Book Appointment</div>);
jest.mock("../pages/QueuePage", () => () => <div>Queue Page</div>);
jest.mock("../pages/AppointmentsPage", () => () => <div>Appointments Page</div>);
jest.mock("../pages/resetPasswordPage", () => () => <div>Reset Password Page</div>);
jest.mock("../pages/staffAuth", () => () => <div>Staff Auth Callback</div>);
jest.mock("../pages/adminAuth", () => () => <div>Admin Auth Callback</div>);
jest.mock("../pages/analyticsPage", () => () => <div>Analytics Page</div>);

describe("App routing", () => {
  afterEach(() => {
    cleanup();
    window.history.pushState({}, "", "/");
  });

  const routes = [
    { path: "/", text: "Landing Page" },
    { path: "/login", text: "Login Page" },
    { path: "/signup", text: "Signup Page" },
    { path: "/admin", text: "Admin Dashboard" },
    { path: "/patient", text: "Patient Dashboard" },
    { path: "/staff", text: "Staff Dashboard" },
    { path: "/patient/book", text: "Book Appointment" },
    { path: "/patient/queue", text: "Queue Page" },
    { path: "/patient/appointments", text: "Appointments Page" },
    { path: "/auth/callback", text: "Auth Callback" },
    { path: "/staff/auth/callback", text: "Staff Auth Callback" },
    { path: "/reset-password", text: "Reset Password Page" },
    { path: "/admin/auth/callback", text: "Admin Auth Callback" },
    { path: "/analytics", text: "Analytics Page" },
  ];

  test.each(routes)("renders correct page for $path", ({ path, text }) => {
    window.history.pushState({}, "", path);

    render(<App />);

    expect(screen.getByText(text)).toBeInTheDocument();
  });
});