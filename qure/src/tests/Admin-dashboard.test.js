// AdminDashboard.test.jsx

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import AdminDashboard from "../pages/Admin-dashboard";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../assets/images/TLogo.png", () => "logo-mock.png");

jest.mock("../lib/auth", () => ({
  logout: jest.fn(),
  createAdminInvite: jest.fn(),
}));

jest.mock("../lib/adminService", () => ({
  createClinicStaffInvite: jest.fn(),
}));

jest.mock("../pages/clinicService", () => ({
  searchClinics: jest.fn(),
}));

const mockGetUser = jest.fn();
const mockUpdateUser = jest.fn();

const mockFrom = jest.fn();

jest.mock("../lib/supabaseClient", () => ({
  supabaseClient: {
    auth: {
      getUser: (...args) => mockGetUser(...args),
      updateUser: (...args) => mockUpdateUser(...args),
    },
    from: (...args) => mockFrom(...args),
  },
}));

import { logout, createAdminInvite } from "../lib/auth";
import { createClinicStaffInvite } from "../lib/adminService";
import { searchClinics } from "../pages/clinicService";

describe("AdminDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "admin@test.com",
          user_metadata: {
            full_name: "Admin User",
          },
        },
      },
      error: null,
    });

    mockUpdateUser.mockResolvedValue({
      error: null,
    });

    mockFrom.mockImplementation((table) => {
      if (table === "profiles") {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: {
                  user_name: "AdminUser",
                },
                error: null,
              }),
            })),
          })),
        };
      }

      if (table === "clinicStaff") {
        return {
          select: jest.fn(() => ({
            mockResolvedValue: {
              count: 5,
              error: null,
            },
          })),
        };
      }

      if (table === "clinics") {
        return {
          select: jest.fn(() => ({
            mockResolvedValue: {
              count: 3,
              error: null,
            },
          })),
        };
      }

      if (table === "appointments") {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn().mockResolvedValue({
                count: 10,
                error: null,
              }),
            })),
          })),
        };
      }

      if (table === "queue_entries") {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              count: 2,
              error: null,
            }),
          })),
        };
      }

      if (table === "recent_activity") {
        return {
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            })),
          })),
          insert: jest.fn().mockResolvedValue({
            error: null,
          }),
        };
      }

      return {
        select: jest.fn(),
      };
    });
  });

  test("renders dashboard heading", async () => {
    render(<AdminDashboard />);

    expect(
      screen.getByText(/Admin Dashboard/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText(/Welcome back/i)
      ).toBeInTheDocument();
    });
  });

  test("opens add admin popup", async () => {
    render(<AdminDashboard />);

    const button = screen.getByRole("button", {
      name: /^Add Admin$/i,
    });

    await userEvent.click(button);

    expect(
      screen.getByRole("heading", {
        name: /^Add Admin$/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/Email/i)
    ).toBeInTheDocument();
  });

  test("submits add admin form successfully", async () => {
    createAdminInvite.mockResolvedValue({});

    render(<AdminDashboard />);

    await userEvent.click(
      screen.getByRole("button", {
        name: /Add Admin/i,
      })
    );

    const input = screen.getByLabelText(/Email/i);

    await userEvent.type(input, "newadmin@test.com");

    await userEvent.click(
      screen.getByRole("button", {
        name: /Save Admin/i,
      })
    );

    await waitFor(() => {
      expect(createAdminInvite).toHaveBeenCalledWith(
        "newadmin@test.com"
      );
    });
  });

  test("logout redirects user", async () => {
    logout.mockResolvedValue({});

    render(<AdminDashboard />);

    await userEvent.click(
      screen.getByRole("button", {
        name: /Logout/i,
      })
    );

    await waitFor(() => {
      expect(logout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  test("opens profile popup", async () => {
    render(<AdminDashboard />);

    await userEvent.click(
      screen.getByRole("button", {
        name: /Profile/i,
      })
    );

    expect(
      screen.getByText(/Profile Settings/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Change Username/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Change Password/i)
    ).toBeInTheDocument();
  });

  test("shows validation when passwords do not match", async () => {
    render(<AdminDashboard />);

    await userEvent.click(
      screen.getByRole("button", {
        name: /Profile/i,
      })
    );

    const passwordInputs = screen.getAllByPlaceholderText(
      /new password/i
    );

    await userEvent.type(passwordInputs[0], "password123");

    const confirmInput = screen.getByPlaceholderText(
      /Confirm new password/i
    );

    await userEvent.type(confirmInput, "wrongpassword");

    await userEvent.click(
      screen.getByRole("button", {
        name: /Update Password/i,
      })
    );

    expect(
      screen.getByText(/Passwords do not match/i)
    ).toBeInTheDocument();
  });

  test("opens add staff popup", async () => {
    render(<AdminDashboard />);

    await userEvent.click(
      screen.getByRole("button", {
        name: /Add Staff Member/i,
      })
    );

    expect(
      screen.getByText(/Assign Clinic/i)
    ).toBeInTheDocument();
  });

  test("searches clinics for staff assignment", async () => {
    searchClinics.mockResolvedValue([
      {
        id: 1,
        facility_name: "Test Clinic",
        admin1: "Gauteng",
        facility_type: "Clinic",
      },
    ]);

    render(<AdminDashboard />);

    await userEvent.click(
      screen.getByRole("button", {
        name: /Add Staff Member/i,
      })
    );

    const searchInput = screen.getByPlaceholderText(
      /Type clinic name/i
    );

    await userEvent.type(searchInput, "Test");

    await waitFor(() => {
      expect(searchClinics).toHaveBeenCalled();
    });

    expect(
      screen.getByText(/Test Clinic/i)
    ).toBeInTheDocument();
  });

  test("opens clinic edit popup", async () => {
    render(<AdminDashboard />);

    await userEvent.click(
      screen.getByRole("button", {
        name: /Edit Clinic/i,
      })
    );

    expect(
      screen.getByText(/Edit Clinic Hours/i)
    ).toBeInTheDocument();
  });

  test("opens staff list modal", async () => {
    render(<AdminDashboard />);

    await userEvent.click(
      screen.getByRole("button", {
        name: /^Staff$/i,
      })
    );

    expect(
      screen.getByText(/Staff Members/i)
    ).toBeInTheDocument();
  });

  test("opens clinic list modal", async () => {
    render(<AdminDashboard />);

    await userEvent.click(
      screen.getByRole("button", {
        name: /^Clinics$/i,
      })
    );

    expect(
      screen.getByRole("heading", {
        name: /^Clinics$/i,
      })
    ).toBeInTheDocument();
  });

  test("displays recent activity fallback text", async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/No recent activity yet/i)
      ).toBeInTheDocument();
    });
  });
  describe("Additional AdminDashboard coverage", () => {
    test("opens and closes add admin modal", async () => {
      render(<AdminDashboard />);

      await userEvent.click(
        screen.getByRole("button", {
          name: /^Add Admin$/i,
        })
      );

      expect(
        screen.getByRole("heading", {
          name: /^Add Admin$/i,
        })
      ).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole("button", {
          name: /^Cancel$/i,
        })
      );

      expect(
        screen.queryByRole("heading", {
          name: /^Add Admin$/i,
        })
      ).not.toBeInTheDocument();
    });

    test("navigates to analytics page", async () => {
      render(<AdminDashboard />);

      await userEvent.click(
        screen.getByRole("button", {
          name: /^Analytics$/i,
        })
      );

      expect(mockNavigate).toHaveBeenCalledWith("/analytics");
    });

    test("opens and closes profile popup", async () => {
      render(<AdminDashboard />);

      await userEvent.click(
        screen.getByRole("button", {
          name: /^Profile$/i,
        })
      );

      expect(
        screen.getByRole("heading", {
          name: /Profile Settings/i,
        })
      ).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole("button", {
          name: /^Close$/i,
        })
      );

      await waitFor(() => {
        expect(
          screen.queryByRole("heading", {
            name: /Profile Settings/i,
          })
        ).not.toBeInTheDocument();
      });
    });

    test("shows password required validation", async () => {
      render(<AdminDashboard />);

      await userEvent.click(
        screen.getByRole("button", {
          name: /^Profile$/i,
        })
      );

      await userEvent.click(
        screen.getByRole("button", {
          name: /Update Password/i,
        })
      );

      expect(
        screen.getByText(
          /Please enter and confirm your new password/i
        )
      ).toBeInTheDocument();
    });

    test("shows password length validation", async () => {
      render(<AdminDashboard />);

      await userEvent.click(
        screen.getByRole("button", {
          name: /^Profile$/i,
        })
      );

      const passwordInput = screen.getByPlaceholderText(
        /Enter new password/i
      );

      const confirmInput = screen.getByPlaceholderText(
        /Confirm new password/i
      );

      await userEvent.type(passwordInput, "123");
      await userEvent.type(confirmInput, "123");

      await userEvent.click(
        screen.getByRole("button", {
          name: /Update Password/i,
        })
      );

      expect(
        screen.getByText(
          /Password must be at least 6 characters long/i
        )
      ).toBeInTheDocument();
    });

    test("shows username validation error", async () => {
      render(<AdminDashboard />);

      await userEvent.click(
        screen.getByRole("button", {
          name: /^Profile$/i,
        })
      );

      const usernameInput = screen.getByPlaceholderText(
        /Enter new username/i
      );

      fireEvent.change(usernameInput, {
        target: { value: "   " },
      });

      await userEvent.click(
        screen.getByRole("button", {
          name: /Update Username/i,
        })
      );

      expect(
        screen.getByText(/Username cannot be empty/i)
      ).toBeInTheDocument();
    });

    test("opens and closes add staff popup", async () => {
      render(<AdminDashboard />);

      await userEvent.click(
        screen.getByRole("button", {
          name: /Add Staff Member/i,
        })
      );

      expect(
        screen.getByRole("heading", {
          name: /Add Staff Member/i,
        })
      ).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole("button", {
          name: /^Cancel$/i,
        })
      );

      expect(
        screen.queryByRole("heading", {
          name: /Add Staff Member/i,
        })
      ).not.toBeInTheDocument();
    });

    test("opens and closes clinic edit popup", async () => {
      render(<AdminDashboard />);

      await userEvent.click(
        screen.getByRole("button", {
          name: /Edit Clinic/i,
        })
      );

      expect(
        screen.getByRole("heading", {
          name: /Edit Clinic Hours/i,
        })
      ).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole("button", {
          name: /^Cancel$/i,
        })
      );

      expect(
        screen.queryByRole("heading", {
          name: /Edit Clinic Hours/i,
        })
      ).not.toBeInTheDocument();
    });

    test("renders dashboard stat cards", async () => {
      render(<AdminDashboard />);

      expect(
        screen.getByText(/Total Staff/i)
      ).toBeInTheDocument();

      expect(
        screen.getByText(/Total Clinics/i)
      ).toBeInTheDocument();

      expect(
        screen.getByText(/Appointments Today/i)
      ).toBeInTheDocument();

      expect(
        screen.getByText(/Patients Waiting/i)
      ).toBeInTheDocument();
    });

    test("handles admin invite failure", async () => {
      createAdminInvite.mockRejectedValue(
        new Error("Invite failed")
      );

      render(<AdminDashboard />);

      await userEvent.click(
        screen.getByRole("button", {
          name: /^Add Admin$/i,
        })
      );

      await userEvent.type(
        screen.getByLabelText(/Email/i),
        "fail@test.com"
      );

      await userEvent.click(
        screen.getByRole("button", {
          name: /Save Admin/i,
        })
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Invite failed/i)
        ).toBeInTheDocument();
      });
    });

    test("opens and closes staff list modal", async () => {
      render(<AdminDashboard />);

      await userEvent.click(
        screen.getByRole("button", {
          name: /^Staff$/i,
        })
      );

      expect(
        screen.getByRole("heading", {
          name: /Staff Members/i,
        })
      ).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole("button", {
          name: /^Close$/i,
        })
      );

      await waitFor(() => {
        expect(
          screen.queryByRole("heading", {
            name: /Staff Members/i,
          })
        ).not.toBeInTheDocument();
      });
    });
    test("shows success message after successful admin invite", async () => {
      createAdminInvite.mockResolvedValue({});

      render(<AdminDashboard />);

      await userEvent.click(
        screen.getByRole("button", {
          name: /Add Admin/i,
        })
      );

      await userEvent.type(
        screen.getByLabelText(/Email/i),
        "success@test.com"
      );

      await userEvent.click(
        screen.getByRole("button", {
          name: /Save Admin/i,
        })
      );

      await waitFor(() => {
        expect(
          screen.getByText(
            /Tell success@test.com to check their inbox/i
          )
        ).toBeInTheDocument();
      });
    });

    test("updates password successfully", async () => {
      render(<AdminDashboard />);

      await userEvent.click(
        screen.getByRole("button", {
          name: /Profile/i,
        })
      );

      await userEvent.type(
        screen.getByPlaceholderText(/Enter new password/i),
        "password123"
      );

      await userEvent.type(
        screen.getByPlaceholderText(/Confirm new password/i),
        "password123"
      );

      await userEvent.click(
        screen.getByRole("button", {
          name: /Update Password/i,
        })
      );

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({
          password: "password123",
        });
      });

      expect(
        screen.getByText(/Password updated successfully/i)
      ).toBeInTheDocument();
    });

    test("handles password update failure", async () => {
      mockUpdateUser.mockResolvedValue({
        error: { message: "Update failed" },
      });

      render(<AdminDashboard />);

      await userEvent.click(
        screen.getByRole("button", {
          name: /Profile/i,
        })
      );

      await userEvent.type(
        screen.getByPlaceholderText(/Enter new password/i),
        "password123"
      );

      await userEvent.type(
        screen.getByPlaceholderText(/Confirm new password/i),
        "password123"
      );

      await userEvent.click(
        screen.getByRole("button", {
          name: /Update Password/i,
        })
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Update failed/i)
        ).toBeInTheDocument();
      });
    });

    test("shows alert when submitting staff form without clinic selected", async () => {
      window.alert = jest.fn();

      render(<AdminDashboard />);

      await userEvent.click(
        screen.getByRole("button", {
          name: /Add Staff Member/i,
        })
      );

      await userEvent.type(
        screen.getByLabelText(/Email/i),
        "staff@test.com"
      );

      await userEvent.click(
        screen.getByRole("button", {
          name: /Save Staff/i,
        })
      );

      expect(window.alert).toHaveBeenCalledWith(
        "Please select a clinic first."
      );
    });

    test("selects clinic from search results", async () => {
      searchClinics.mockResolvedValue([
        {
          id: 1,
          facility_name: "Selected Clinic",
          admin1: "Gauteng",
          facility_type: "Clinic",
        },
      ]);

      render(<AdminDashboard />);

      await userEvent.click(
        screen.getByRole("button", {
          name: /Add Staff Member/i,
        })
      );

      await userEvent.type(
        screen.getByPlaceholderText(/Type clinic name/i),
        "Selected"
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Selected Clinic/i)
        ).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getByRole("button", {
          name: /Select/i,
        })
      );

      expect(
        screen.getByText(/Selected clinic:/i)
      ).toBeInTheDocument();
    });

    test("handles clinic search failure", async () => {
      searchClinics.mockRejectedValue(
        new Error("Search failed")
      );

      render(<AdminDashboard />);

      await userEvent.click(
        screen.getByRole("button", {
          name: /Add Staff Member/i,
        })
      );

      await userEvent.type(
        screen.getByPlaceholderText(/Type clinic name/i),
        "Clinic"
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to search clinics/i)
        ).toBeInTheDocument();
      });
    });

    test("shows no clinics found message", async () => {
      searchClinics.mockResolvedValue([]);

      render(<AdminDashboard />);

      await userEvent.click(
        screen.getByRole("button", {
          name: /Add Staff Member/i,
        })
      );

      await userEvent.type(
        screen.getByPlaceholderText(/Type clinic name/i),
        "Unknown"
      );

      await waitFor(() => {
        expect(
          screen.getByText(/No clinics found/i)
        ).toBeInTheDocument();
      });
    });

    test("opens confirmation modal when removing staff", async () => {
      mockFrom.mockImplementation((table) => {
        if (table === "profiles") {
          return {
            select: jest.fn(() => ({
              eq: jest.fn((field) => {
                // fetchAdminName chain
                if (field === "id") {
                  return {
                    single: jest.fn().mockResolvedValue({
                      data: {
                        user_name: "AdminUser",
                      },
                      error: null,
                    }),
                  };
                }

                // staff search chain
                return {
                  ilike: jest.fn(() => ({
                    limit: jest.fn().mockResolvedValue({
                      data: [
                        {
                          email: "staff@test.com",
                          role: "clinicstaff",
                          user_name: "Staff User",
                        },
                      ],
                      error: null,
                    }),
                  })),
                };
              }),
            })),
          };
        }

        if (table === "recent_activity") {
          return {
            select: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              })),
            })),
            insert: jest.fn().mockResolvedValue({
              error: null,
            }),
          };
        }

        return {
          select: jest.fn(),
        };
      });

      render(<AdminDashboard />);

      await userEvent.click(
        screen.getByRole("button", {
          name: /^Staff$/i,
        })
      );

      const input = screen.getByPlaceholderText(
        /Search staff/i
      );

      await userEvent.type(input, "staff");

      await waitFor(() => {
        expect(
          screen.getByText(/Staff User/i)
        ).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getByRole("button", {
          name: /Remove/i,
        })
      );

      expect(
        screen.getByText(/Confirm Removal/i)
      ).toBeInTheDocument();

      expect(
  screen.getAllByText(/staff@test.com/i).length
).toBeGreaterThan(0);
    });

    test("shows loading state while saving admin", async () => {
      createAdminInvite.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({}), 100)
          )
      );

      render(<AdminDashboard />);

      await userEvent.click(
        screen.getByRole("button", {
          name: /Add Admin/i,
        })
      );

      await userEvent.type(
        screen.getByLabelText(/Email/i),
        "loading@test.com"
      );

      await userEvent.click(
        screen.getByRole("button", {
          name: /Save Admin/i,
        })
      );

      expect(
        screen.getByText(/Saving/i)
      ).toBeInTheDocument();
    });

    test("logout still redirects when logout fails", async () => {
      logout.mockRejectedValue(new Error("Logout failed"));

      render(<AdminDashboard />);

      await userEvent.click(
        screen.getByRole("button", {
          name: /Logout/i,
        })
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });

    test("renders formatted recent activity entries", async () => {
      mockFrom.mockImplementation((table) => {
        if (table === "recent_activity") {
          return {
            select: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn().mockResolvedValue({
                  data: [
                    {
                      message: "Admin updated clinic",
                      created_at: "2025-01-01T10:00:00Z",
                    },
                  ],
                  error: null,
                }),
              })),
            })),
            insert: jest.fn().mockResolvedValue({
              error: null,
            }),
          };
        }

        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: {
                  user_name: "AdminUser",
                },
                error: null,
              }),
            })),
          })),
        };
      });

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(
          screen.getByText(/Admin updated clinic/i)
        ).toBeInTheDocument();
      });
    });
    test("profile popup handles missing username fallback", async () => {
      mockFrom.mockImplementation((table) => {
        if (table === "profiles") {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              })),
            })),
          };
        }

        return {
          select: jest.fn(),
        };
      });

      render(<AdminDashboard />);

      await userEvent.click(
        screen.getByRole("button", { name: /Profile/i })
      );

      expect(
        screen.getByPlaceholderText(/Enter new username/i)
      ).toBeInTheDocument();
    });
    test("handles password update failure error branch", async () => {
      mockUpdateUser.mockResolvedValueOnce({
        error: { message: "Update failed" },
      });

      render(<AdminDashboard />);

      await userEvent.click(
        screen.getByRole("button", { name: /Profile/i })
      );

      await userEvent.type(
        screen.getByPlaceholderText(/Enter new password/i),
        "password123"
      );

      await userEvent.type(
        screen.getByPlaceholderText(/Confirm new password/i),
        "password123"
      );

      await userEvent.click(
        screen.getByRole("button", { name: /Update Password/i })
      );

      await waitFor(() => {
        expect(screen.getByText(/Update failed/i)).toBeInTheDocument();
      });
    });
  });
});