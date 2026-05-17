import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import AdminDashboard from "../pages/Admin-dashboard";

// ---------------- MOCKS ----------------

jest.mock("../styles/Admin.css", () => ({}));
jest.mock("../assets/images/TLogo.png", () => "logo.png");

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// ---------------- SERVICES ----------------

const mockCreateAdminInvite = jest.fn();
const mockLogout = jest.fn();
const mockCreateClinicStaffInvite = jest.fn();
const mockSearchClinics = jest.fn();

jest.mock("../lib/auth", () => ({
  createAdminInvite: (...a) => mockCreateAdminInvite(...a),
  logout: (...a) => mockLogout(...a),
}));

jest.mock("../lib/adminService", () => ({
  createClinicStaffInvite: (...a) =>
    mockCreateClinicStaffInvite(...a),
}));

jest.mock("../pages/clinicService", () => ({
  searchClinics: (...a) => mockSearchClinics(...a),
}));

// ---------------- SUPABASE (SAFE PATTERN) ----------------

const mockAuthGetUser = jest.fn();

const mockSingle = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();

const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockIlike = jest.fn();
const mockLimit = jest.fn();
const mockOrder = jest.fn();

jest.mock("../lib/supabaseClient", () => ({
  supabaseClient: {
    auth: {
      getUser: (...a) => mockAuthGetUser(...a),
    },
    from: (...args) => mockFrom(...args),
  },
}));

// ---------------- HELPERS ----------------

const mockUser = {
  id: "user-1",
  email: "admin@test.com",
  user_metadata: { full_name: "Admin User" },
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();

  mockAuthGetUser.mockResolvedValue({
    data: { user: mockUser },
    error: null,
  });

  // IMPORTANT: chain-safe mock
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    ilike: mockIlike,
    limit: mockLimit,
    order: mockOrder,
  });

  mockSelect.mockReturnValue({
    eq: mockEq,
    order: mockOrder,
  });

  mockEq.mockReturnValue({
    single: mockSingle,
    limit: mockLimit,
    ilike: mockIlike,
  });

  mockLimit.mockResolvedValue({
    data: [],
    error: null,
  });

  mockSingle.mockResolvedValue({
    data: { user_name: "AdminUser" },
    error: null,
  });

  mockIlike.mockResolvedValue({
    data: [],
    error: null,
  });
});

afterEach(() => {
  jest.useRealTimers();
});

// ---------------- TESTS ----------------

test("renders dashboard and welcome message", async () => {
  render(<AdminDashboard />);

  expect(await screen.findByText(/Admin Dashboard/i)).toBeInTheDocument();
  expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
});

test("opens staff popup", async () => {
  render(<AdminDashboard />);

  fireEvent.click(screen.getByText(/Add Staff Member/i));

  expect(await screen.findByText(/Assign Clinic/i)).toBeInTheDocument();
});

test("opens admin popup and submits invite", async () => {
  mockCreateAdminInvite.mockResolvedValue({});

  render(<AdminDashboard />);

  fireEvent.click(screen.getByText(/Add Admin/i));

  const emailInput = await screen.findByLabelText(/Email/i);

  userEvent.type(emailInput, "newadmin@test.com");

  fireEvent.click(screen.getByText(/Save Admin/i));

  await waitFor(() => {
    expect(mockCreateAdminInvite).toHaveBeenCalledWith("newadmin@test.com");
  });
});

test("logout works and navigates home", async () => {
  mockLogout.mockResolvedValue({});

  render(<AdminDashboard />);

  fireEvent.click(screen.getByText(/Logout/i));

  await waitFor(() => {
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});

test("profile popup opens", async () => {
  render(<AdminDashboard />);

  fireEvent.click(screen.getByText(/Profile/i));

  expect(await screen.findByText(/Change Username/i)).toBeInTheDocument();
});

test("updates username successfully", async () => {
  mockFrom.mockReturnValue({
    ...mockFrom(),
    update: () => ({
      eq: jest.fn().mockResolvedValue({ error: null }),
    }),
  });

  render(<AdminDashboard />);

  fireEvent.click(screen.getByText(/Profile/i));

  const input = await screen.findByPlaceholderText(/Enter new username/i);

  userEvent.type(input, "NewName");

  fireEvent.click(screen.getByText(/Update Username/i));

  await waitFor(() => {
    expect(screen.getByText(/Username updated successfully/i)).toBeInTheDocument();
  });
});

test("opens staff list from sidebar", async () => {
  const user = userEvent.setup();

  render(<AdminDashboard />);

  // Wait for sidebar to exist (ensures React finished initial render)
  const sidebar = document.querySelector(".admin-sidebar");

  expect(sidebar).toBeInTheDocument();

  // Scope query strictly to sidebar to avoid duplicate "Staff" matches
  const staffButton = within(sidebar).getByRole("button", {
    name: /^staff$/i,
  });

  await user.click(staffButton);

  // Verify staff modal opened
  expect(
    await screen.findByText(/staff members/i)
  ).toBeInTheDocument();
});

test("clinic popup opens", async () => {
  render(<AdminDashboard />);

  fireEvent.click(screen.getByText(/Edit Clinic/i));

  expect(await screen.findByText(/Edit Operating Hours/i)).toBeInTheDocument();
});