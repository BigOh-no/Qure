import React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";

import StaffDashboard from "../pages/Staff-dashboard";
import * as staffService from "../pages/staffService";

// Mock router
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock assets
jest.mock("../assets/images/TLogo.png", () => "logo.png");

// Mock Supabase
jest.mock("../lib/supabaseClient", () => ({
  supabaseClient: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: "staff-1",
            email: "staff@test.com",
            user_metadata: {},
          },
        },
        error: null,
      }),

      updateUser: jest.fn().mockResolvedValue({
        data: {},
        error: null,
      }),
    },

    from: jest.fn(() => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: {
              user_name: "StaffUser",
            },
            error: null,
          }),
        }),
      }),

      update: () => ({
        eq: async () => ({
          error: null,
        }),
      }),
    })),
  },
}));

// Mock service layer
jest.mock("../pages/staffService");

describe("StaffDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockQueue = {
    clinicName: "Test Clinic",
    open_t: "08:00",
    closed_t: "17:00",

    patients: [
      {
        id: 1,
        patient_name: "John Doe",
        joined_at: "2026-05-08T10:00:00Z",
        status: "waiting",
      },
    ],
  };

  const mockAppointments = [
    {
      id: 1,
      patient_email: "john@test.com",
      appointment_date: "2099-05-10",
      appointment_time: "10:00",
      status: "booked",
    },
  ];

  test("renders clinic and queue data", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      mockAppointments
    );

    render(<StaffDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText("Test Clinic")
      ).toBeInTheDocument();

      expect(
        screen.getByText("John Doe")
      ).toBeInTheDocument();
    });
  });

  test("renders clinic hours", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      []
    );

    render(<StaffDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/clinic hours/i)
      ).toBeInTheDocument();
    });
  });

  test("shows empty queue state", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue({
      clinicName: "Test Clinic",
      open_t: "08:00",
      closed_t: "17:00",
      patients: [],
    });

    staffService.getClinicAppointments.mockResolvedValue(
      []
    );

    render(<StaffDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/no patients in queue/i)
      ).toBeInTheDocument();
    });
  });

  test("updates queue status", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      []
    );

    staffService.updateQueueStatus.mockResolvedValue(
      {}
    );

    render(<StaffDashboard />);

    await screen.findByText("John Doe");

    fireEvent.click(screen.getByText("Start"));

    await waitFor(() => {
      expect(
        staffService.updateQueueStatus
      ).toHaveBeenCalledWith(
        1,
        "in_consultation"
      );
    });
  });

  test("completes queue status", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      []
    );

    staffService.updateQueueStatus.mockResolvedValue(
      {}
    );

    render(<StaffDashboard />);

    await screen.findByText("John Doe");

    fireEvent.click(screen.getByText("Complete"));

    await waitFor(() => {
      expect(
        staffService.updateQueueStatus
      ).toHaveBeenCalledWith(
        1,
        "completed"
      );
    });
  });

  test("creates appointment", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      []
    );

    staffService.staffCreateAppointment.mockResolvedValue({
      id: 2,
      patient_email: "new@test.com",
      appointment_date: "2099-05-12",
      appointment_time: "11:00",
      status: "booked",
    });

    render(<StaffDashboard />);

    fireEvent.change(
      screen.getByPlaceholderText(
        /enter patient email address/i
      ),
      {
        target: { value: "new@test.com" },
      }
    );

    fireEvent.change(
      screen.getByLabelText(/appointment date/i),
      {
        target: { value: "2099-05-12" },
      }
    );

    fireEvent.change(
      screen.getByLabelText(/appointment time/i),
      {
        target: { value: "11:00" },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /create appointment/i,
      })
    );

    await waitFor(() => {
      expect(
        staffService.staffCreateAppointment
      ).toHaveBeenCalledWith({
        patientEmail: "new@test.com",
        appointmentDate: "2099-05-12",
        appointmentTime: "11:00",
      });
    });
  });

  test("shows validation message when appointment form is incomplete", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      []
    );

    render(<StaffDashboard />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /create appointment/i,
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /please fill in all appointment fields/i
        )
      ).toBeInTheDocument();
    });
  });

  test("renders appointment list", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      mockAppointments
    );

    render(<StaffDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText("john@test.com")
      ).toBeInTheDocument();
    });
  });

  test("cancels appointment", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      mockAppointments
    );

    staffService.staffCancelAppointment.mockResolvedValue({
      ...mockAppointments[0],
      status: "cancelled",
    });

    render(<StaffDashboard />);

    await screen.findByText("john@test.com");

    fireEvent.click(screen.getByText("Cancel"));

    await waitFor(() => {
      expect(
        staffService.staffCancelAppointment
      ).toHaveBeenCalledWith(1);
    });
  });

  test("starts reschedule flow", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      mockAppointments
    );

    render(<StaffDashboard />);

    await screen.findByText("john@test.com");

    fireEvent.click(screen.getByText("Reschedule"));

    await waitFor(() => {
      expect(
        screen.getByText("Save")
      ).toBeInTheDocument();

      expect(
        screen.getByText("Cancel Edit")
      ).toBeInTheDocument();
    });
  });

  test("reschedules appointment", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      mockAppointments
    );

    staffService.staffRescheduleAppointment.mockResolvedValue({
      ...mockAppointments[0],
      appointment_date: "2099-06-01",
      appointment_time: "12:00",
    });

    render(<StaffDashboard />);

    await screen.findByText("john@test.com");

    fireEvent.click(screen.getByText("Reschedule"));

    fireEvent.change(
      screen.getByDisplayValue("2099-05-10"),
      {
        target: { value: "2099-06-01" },
      }
    );

    fireEvent.change(
      screen.getByDisplayValue("10:00"),
      {
        target: { value: "12:00" },
      }
    );

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(
        staffService.staffRescheduleAppointment
      ).toHaveBeenCalledWith({
        appointmentId: 1,
        appointmentDate: "2099-06-01",
        appointmentTime: "12:00",
      });
    });
  });

  test("filters appointments", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      mockAppointments
    );

    render(<StaffDashboard />);

    await screen.findByText("john@test.com");

    fireEvent.click(
      screen.getByRole("button", {
        name: /all/i,
      })
    );

    expect(
      screen.getByText("john@test.com")
    ).toBeInTheDocument();
  });

  test("opens profile popup", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      []
    );

    render(<StaffDashboard />);

    fireEvent.click(screen.getByText("Profile"));

    await waitFor(() => {
      expect(
        screen.getByText(/profile settings/i)
      ).toBeInTheDocument();
    });
  });

  test("logout navigates home", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      []
    );

    render(<StaffDashboard />);

    fireEvent.click(screen.getByText(/logout/i));

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  test("shows loading queue state initially", () => {
    staffService.getStaffClinicAndQueue.mockReturnValue(
      new Promise(() => {})
    );

    staffService.getClinicAppointments.mockResolvedValue(
      []
    );

    render(<StaffDashboard />);

    expect(
      screen.getByText(/loading queue/i)
    ).toBeInTheDocument();
  });

  test("shows loading appointments state initially", () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockReturnValue(
      new Promise(() => {})
    );

    render(<StaffDashboard />);

    expect(
      screen.getByText(/loading appointments/i)
    ).toBeInTheDocument();
  });

  test("shows no appointments message", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      []
    );

    render(<StaffDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(
          /no appointments found for this filter/i
        )
      ).toBeInTheDocument();
    });
  });

  test("shows patient count", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      []
    );

    render(<StaffDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText((content, element) =>
          element?.textContent === "1 patients"
        )
      ).toBeInTheDocument();
    });
  });

  test("shows appointment count", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      mockAppointments
    );

    render(<StaffDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText((content, element) =>
          element?.textContent === "1 appointments"
        )
      ).toBeInTheDocument();
    });
  });

  test("shows waiting status correctly", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      []
    );

    render(<StaffDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText("Waiting")
      ).toBeInTheDocument();
    });
  });

  test("renders appointment action buttons", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      mockAppointments
    );

    render(<StaffDashboard />);

    await screen.findByText("john@test.com");

    expect(
      screen.getByText("Reschedule")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Cancel")
    ).toBeInTheDocument();
  });

  test("cancel edit button exits reschedule mode", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      mockAppointments
    );

    render(<StaffDashboard />);

    await screen.findByText("john@test.com");

    fireEvent.click(screen.getByText("Reschedule"));

    fireEvent.click(screen.getByText("Cancel Edit"));

    await waitFor(() => {
      expect(
        screen.queryByText("Save")
      ).not.toBeInTheDocument();
    });
  });

  test("shows appointment filter buttons", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      mockAppointments
    );

    render(<StaffDashboard />);

    await screen.findByText("john@test.com");

    expect(
      screen.getByRole("button", {
        name: /upcoming/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /past/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /cancelled/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /all/i,
      })
    ).toBeInTheDocument();
  });

  test("shows success message after queue update", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      []
    );

    staffService.updateQueueStatus.mockResolvedValue(
      {}
    );

    render(<StaffDashboard />);

    await screen.findByText("John Doe");

    fireEvent.click(screen.getByText("Start"));

    await waitFor(() => {
      expect(
        screen.getByText(
          /queue status updated successfully/i
        )
      ).toBeInTheDocument();
    });
  });
  test("shows queue update error message", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      []
    );

    staffService.updateQueueStatus.mockRejectedValue(
      new Error("Failed")
    );

    render(<StaffDashboard />);

    await screen.findByText("John Doe");

    fireEvent.click(screen.getByText("Start"));

    await waitFor(() => {
      expect(
        screen.getByText(
          /could not update queue status/i
        )
      ).toBeInTheDocument();
    });
  });

  test("shows create appointment service failure", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      []
    );

    staffService.staffCreateAppointment.mockResolvedValue(
      null
    );

    render(<StaffDashboard />);

    fireEvent.change(
      screen.getByPlaceholderText(
        /enter patient email address/i
      ),
      {
        target: { value: "bad@test.com" },
      }
    );

    fireEvent.change(
      screen.getByLabelText(/appointment date/i),
      {
        target: { value: "2099-05-12" },
      }
    );

    fireEvent.change(
      screen.getByLabelText(/appointment time/i),
      {
        target: { value: "11:00" },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /create appointment/i,
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /could not create appointment/i
        )
      ).toBeInTheDocument();
    });
  });

  test("shows create appointment thrown error", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      []
    );

    staffService.staffCreateAppointment.mockRejectedValue(
      new Error("Server error")
    );

    render(<StaffDashboard />);

    fireEvent.change(
      screen.getByPlaceholderText(
        /enter patient email address/i
      ),
      {
        target: { value: "bad@test.com" },
      }
    );

    fireEvent.change(
      screen.getByLabelText(/appointment date/i),
      {
        target: { value: "2099-05-12" },
      }
    );

    fireEvent.change(
      screen.getByLabelText(/appointment time/i),
      {
        target: { value: "11:00" },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /create appointment/i,
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/server error/i)
      ).toBeInTheDocument();
    });
  });

  test("shows cancel appointment error", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      mockAppointments
    );

    staffService.staffCancelAppointment.mockRejectedValue(
      new Error("Failed")
    );

    render(<StaffDashboard />);

    await screen.findByText("john@test.com");

    fireEvent.click(screen.getByText("Cancel"));

    await waitFor(() => {
      expect(
        screen.getByText(
          /could not cancel appointment/i
        )
      ).toBeInTheDocument();
    });
  });

  test("shows reschedule validation message", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      mockAppointments
    );

    render(<StaffDashboard />);

    await screen.findByText("john@test.com");

    fireEvent.click(screen.getByText("Reschedule"));

    fireEvent.change(
      screen.getByDisplayValue("2099-05-10"),
      {
        target: { value: "" },
      }
    );

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(
        screen.getByText(
          /please choose a new date and time/i
        )
      ).toBeInTheDocument();
    });
  });

  test("shows reschedule appointment failure", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      mockAppointments
    );

    staffService.staffRescheduleAppointment.mockRejectedValue(
      new Error("Failed")
    );

    render(<StaffDashboard />);

    await screen.findByText("john@test.com");

    fireEvent.click(screen.getByText("Reschedule"));

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(
        screen.getByText(
          /could not reschedule appointment/i
        )
      ).toBeInTheDocument();
    });
  });

  test("filters past appointments correctly", async () => {
    const pastAppointments = [
      {
        id: 3,
        patient_email: "past@test.com",
        appointment_date: "2020-01-01",
        appointment_time: "08:00",
        status: "booked",
      },
    ];

    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      pastAppointments
    );

    render(<StaffDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(
          /no appointments found for this filter/i
        )
      ).toBeInTheDocument();
    });
  });


  test("shows password mismatch validation", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      []
    );

    render(<StaffDashboard />);

    fireEvent.click(screen.getByText("Profile"));

    await screen.findByText(/profile settings/i);

    fireEvent.change(
      screen.getByPlaceholderText(
        /enter new password/i
      ),
      {
        target: { value: "password123" },
      }
    );

    fireEvent.change(
      screen.getByPlaceholderText(
        /confirm new password/i
      ),
      {
        target: { value: "wrongpassword" },
      }
    );

    fireEvent.click(
      screen.getByText(/update password/i)
    );

    expect(
      screen.getByText(/passwords do not match/i)
    ).toBeInTheDocument();
  });

  test("shows password minimum length validation", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      []
    );

    render(<StaffDashboard />);

    fireEvent.click(screen.getByText("Profile"));

    await screen.findByText(/profile settings/i);

    fireEvent.change(
      screen.getByPlaceholderText(
        /enter new password/i
      ),
      {
        target: { value: "123" },
      }
    );

    fireEvent.change(
      screen.getByPlaceholderText(
        /confirm new password/i
      ),
      {
        target: { value: "123" },
      }
    );

    fireEvent.click(
      screen.getByText(/update password/i)
    );

    expect(
      screen.getByText(
        /password must be at least 6 characters long/i
      )
    ).toBeInTheDocument();
  });

  test("closes profile popup", async () => {
    staffService.getStaffClinicAndQueue.mockResolvedValue(
      mockQueue
    );

    staffService.getClinicAppointments.mockResolvedValue(
      []
    );

    render(<StaffDashboard />);

    fireEvent.click(screen.getByText("Profile"));

    await screen.findByText(/profile settings/i);

    fireEvent.click(screen.getByText("Close"));

    await waitFor(() => {
      expect(
        screen.queryByText(/profile settings/i)
      ).not.toBeInTheDocument();
    });
  });
  test("shows Waiting To Be Seen for same-day appointment", async () => {
    const today = new Date().toISOString().split("T")[0];

    const sameDayAppointment = [
      {
        id: 11,
        patient_email: "today@test.com",
        appointment_date: today,
        appointment_time: "23:59",
        status: "booked",
      },
    ];

    staffService.getStaffClinicAndQueue.mockResolvedValue(mockQueue);
    staffService.getClinicAppointments.mockResolvedValue(sameDayAppointment);

    render(<StaffDashboard />);

    await screen.findByText("today@test.com");

    expect(screen.getAllByText(/waiting to be seen/i).length).toBeGreaterThan(0);
  });
  test("renders fallback status class when status is unknown", async () => {
    const weirdQueue = {
      ...mockQueue,
      patients: [
        {
          id: 123,
          patient_name: "Unknown Status Patient",
          joined_at: "2026-05-08T10:00:00Z",
          status: "something_random",
        },
      ],
    };

    staffService.getStaffClinicAndQueue.mockResolvedValue(weirdQueue);
    staffService.getClinicAppointments.mockResolvedValue([]);

    render(<StaffDashboard />);

    await screen.findByText("Unknown Status Patient");

    // ensures fallback class is applied (no crash + renders)
    expect(screen.getByText("Unknown Status Patient")).toBeInTheDocument();
  });
  test("handles missing user in profile popup gracefully", async () => {
    const { supabaseClient } = require("../lib/supabaseClient");

    supabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    staffService.getStaffClinicAndQueue.mockResolvedValue(mockQueue);
    staffService.getClinicAppointments.mockResolvedValue([]);

    render(<StaffDashboard />);

    fireEvent.click(screen.getByText("Profile"));

    await waitFor(() => {
      expect(screen.getByText(/profile settings/i)).toBeInTheDocument();
    });
  });
  test("handles profile fetch error gracefully", async () => {
    const { supabaseClient } = require("../lib/supabaseClient");

    supabaseClient.auth.getUser.mockRejectedValueOnce(new Error("Auth failure"));

    staffService.getStaffClinicAndQueue.mockResolvedValue(mockQueue);
    staffService.getClinicAppointments.mockResolvedValue([]);

    render(<StaffDashboard />);

    fireEvent.click(screen.getByText("Profile"));

    await waitFor(() => {
      expect(screen.getByText(/profile settings/i)).toBeInTheDocument();
    });
  });
});

