# Product Backlog

## Project: Qure Clinic Management System

This product backlog contains the main features, enhancements, and bug fixes planned and completed for the Qure system.  
The backlog is prioritised according to project importance, user value, and development order.

---

## Backlog Summary

| Sprint | Description | Total Story Points | Status |
|---|---|---:|---|
| Sprint 1 | Landing page, sign-up, login, and role-based access | 34 | Completed |
| Sprint 2 | Clinic search, admin user management, bookings, and dashboard totals | 61 | Completed |
| Sprint 3 | Queue management, staff appointment management, admin activity, and staff removal | 62 | Completed |
| Sprint 4 | Analytics, exports, password/account management, and patient check-in | 34 | Completed |

**Total Story Points Completed: 191**

---

# Prioritised Product Backlog

## Sprint 1: Authentication and Basic Navigation

| Priority | Type | User Story / Task | Story Points | Status |
|---|---|---|---:|---|
| High | Feature | As a visitor, I can view the landing page so that I can understand the application and navigate to login or sign-up. | 2 | Completed |
| High | Feature | As a patient, I can access the sign-up page so that I can create a new account. | 2 | Completed |
| High | Feature | As a patient, I can sign up manually so that my account is created and stored in the system. | 5 | Completed |
| Medium | Feature | As a patient, I can register using Google so that my account is created and stored in the system. | 8 | Completed |
| High | Feature | As a user, I can access the login page so that I can sign into my account. | 2 | Completed |
| High | Feature | As a patient, I can log in so that I can access the patient home page. | 5 | Completed |
| High | Feature | As a staff member, I can log in so that I can access the staff home page. | 5 | Completed |
| High | Feature | As an admin, I can log in so that I can access the admin home page. | 5 | Completed |

---

## Sprint 2: Clinic Search, Admin Management, and Bookings

| Priority | Type | User Story / Task | Story Points | Status |
|---|---|---|---:|---|
| High | Feature | As a patient, I can search for a clinic by name and then get a list of clinics. | 3 | Completed |
| High | Feature | As an admin, I can add a staff member to assign them to a clinic. | 5 | Completed |
| High | Feature | As an admin, I can add an admin to give them admin permission. | 5 | Completed |
| High | Feature | As a user, I can log out of my profile so that I can return to the landing page. | 2 | Completed |
| Medium | Feature | As a patient, I can search a clinic by province to get a list of clinics in that province. | 3 | Completed |
| Medium | Feature | As a patient, I can search a clinic by facility type to get a list of clinics of that type. | 3 | Completed |
| Medium | Feature | As an admin, I can view and search for staff so that I can view their information. | 5 | Completed |
| Medium | Feature | As an admin, I can view and search for clinics so that I can view their information. | 5 | Completed |
| High | Feature | As a patient, I can make a booking so that I can secure an appointment at a clinic at a convenient time. | 8 | Completed |
| High | Feature | As a patient, I can cancel a booking so that I can free up my slot if I no longer need the appointment. | 5 | Completed |
| High | Feature | As a patient, I can reschedule a booking so that I can change my appointment to a more suitable date or time. | 8 | Completed |
| Medium | Enhancement | As an admin, I can view the total number of staff so that I can monitor workforce size. | 3 | Completed |
| Medium | Enhancement | As an admin, I can view the total number of clinics so that I can understand the system’s coverage and manage clinic distribution. | 3 | Completed |
| Medium | Enhancement | As an admin, I can view the number of appointments scheduled for today so that I can assess daily workload and operational demand. | 3 | Completed |

---

## Sprint 3: Queue Management and Staff Appointment Management

| Priority | Type | User Story / Task | Story Points | Status |
|---|---|---|---:|---|
| High | Feature | As a patient, I can select a clinic to view the current queue so that I can see how busy the clinic is before deciding to join. | 5 | Completed |
| High | Feature | As a patient, I can join a clinic queue so that I can reserve my place before arriving or while waiting. | 8 | Completed |
| High | Feature | As a patient, I can leave a queue so that I can cancel my place if I no longer want to wait. | 5 | Completed |
| Medium | Enhancement | As an admin, I can edit a clinic’s operating hours so that patients know when the clinic and queue services are available. | 5 | Completed |
| Medium | Enhancement | As an admin, I can view the recent activity of admin changes so that I can keep track of important system updates. | 5 | Completed |
| High | Feature | As a staff member, I can manage the queue so that I can update patient queue progress and keep the clinic flow organised. | 8 | Completed |
| High | Feature | As a staff member, I can create an appointment on a patient’s behalf so that patients who cannot book themselves can still receive appointment slots. | 8 | Completed |
| High | Feature | As a staff member, I can cancel an appointment on a patient’s behalf so that the appointment schedule remains accurate when a patient can no longer attend. | 5 | Completed |
| High | Feature | As a staff member, I can reschedule an appointment on a patient’s behalf so that patients can be moved to a more suitable date or time without losing their booking. | 8 | Completed |
| High | Feature | As an admin, I can remove a staff member so that I can revoke their access when they no longer work at a clinic or should no longer have staff permissions. | 5 | Completed |

---

## Sprint 4: Analytics, Exports, and Account Management

| Priority | Type | User Story / Task | Story Points | Status |
|---|---|---|---:|---|
| High | Feature | As an admin, I can view clinic analytics so that I can monitor clinic performance, patient activity, and operational trends. | 8 | Completed |
| High | Feature | As an admin, I can export clinic analytics as a CSV or PDF file so that I can analyse data externally, generate reports, and keep records. | 8 | Completed |
| High | Feature | As a user, I can reset my password when I forget it so that I can regain access to my account securely. | 5 | Completed |
| Medium | Enhancement | As a user, I can change my username so that I can keep my account information accurate and up to date. | 3 | Completed |
| High | Feature | As a user, I can change my password so that I can maintain the security of my account. | 5 | Completed |
| High | Feature | As a staff member, I can check a patient in to their appointment so that the clinic can record that the patient has arrived and is not a no show. | 5 | Completed |

---

# Additional Planned Enhancements

These items are not part of the completed sprint work, but they can be included as future backlog items.

| Priority | Type | Task | Story Points | Status |
|---|---|---|---:|---|
| Medium | Enhancement | Improve form validation messages across login, sign-up, booking, and profile forms. | 3 | Planned |
| Medium | Enhancement | Improve mobile responsiveness across patient, staff, and admin dashboards. | 5 | Planned |
| Medium | Enhancement | Add loading indicators when fetching clinics, appointments, queues, and analytics. | 3 | Planned |
| Low | Enhancement | Improve empty-state messages when no clinics, staff, bookings, or analytics are available. | 2 | Planned |
| Medium | Enhancement | Add confirmation pop-ups before cancelling bookings, leaving queues, or removing staff members. | 3 | Planned |
| Low | Enhancement | Improve dashboard styling consistency between patient, staff, and admin pages. | 3 | Planned |

---

# Planned Bug Fixes

| Priority | Type | Bug Fix / Task | Story Points | Status |
|---|---|---|---:|---|
| High | Bug Fix | Ensure users are redirected to the correct dashboard after login based on their role. | 3 | Planned |
| High | Bug Fix | Prevent unauthorised users from accessing admin or staff pages directly through the URL. | 5 | Planned |
| Medium | Bug Fix | Ensure cancelled or rescheduled appointments update correctly in the database and user interface. | 5 | Planned |
| Medium | Bug Fix | Ensure queue positions update correctly when a patient joins or leaves a queue. | 5 | Planned |
| Medium | Bug Fix | Ensure exported CSV and PDF analytics display correct date formats and calculated values. | 3 | Planned |
| Low | Bug Fix | Fix minor spelling, spacing, and styling inconsistencies across the application. | 2 | Planned |

---

# Priority Key

| Priority | Meaning |
|---|---|
| High | Important core functionality required for the system to work correctly |
| Medium | Useful functionality that improves usability, management, or user experience |
| Low | Nice-to-have improvements or minor fixes |

---

# Type Key

| Type | Meaning |
|---|---|
| Feature | A new main function of the system |
| Enhancement | An improvement to an existing function |
| Bug Fix | A correction to existing functionality |