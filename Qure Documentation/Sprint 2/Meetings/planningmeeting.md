# Sprint 1 Planning

## Date
14 April 2026

## Team Members
- Aaliah Reddy (2798790)
- Muhammed Bayat (2811604)
- Ammaarah Mia (2807590)
- Vareshan Rajah (2809069)
- Vikram Mahalingam (2800630)

## Sprint Goal
Implement the functionality of searching for clinics. Implement some admin dashboard functionality as well as the front-end for the staff dashboard. 

## Sprint Backlog

### Frontend Development
- Patient home page
- Admin home page
- Staff home page

### Backend Development
- Admins can add other admins
- Admins can add staff members
- Searching for clinics
- Logout of Qure
- Show password in signup and login

## User Stories (for this sprint)
- As a patient, I can search for a clinic by name and then get a list of clinics
- As an admin I can add a staff member to assign them to a clinic
- As an admin I can add an admin to give them admin permission
- As a user, I can log out of my profile so that I can return to the landing page
- As a patient, I can search a clinic by province to get a list of clinics in that province
- As a patient, I can search a clinic by facility type to get a list of clinics of that type

## Extra user stories completed
- As an admin, I can view and search for staff so that I can view their information
- As an admin, I can view and search for clinics so that I can view their information
- As a patient, I can make a booking so that I can secure an appointment at a clinic at a convenient time
- As a patient, I can cancel a booking so that I can free up my slot if I no longer need the appointment
- As a patient, I can reschedule a booking so that I can change my appointment to a more suitable date or time
- As an admin, I can view the total number of staff so that I can monitor workforce size
- As an admin, I can view the total number of clinics so that I can understand the systems coverage and manage clinic distribution
- As an admin, I can view the number of appointments scheduled for today so that I can assess daily workload and operational demand.

## User acceptance tests
Search for a clinic by name:

Scenario 1: Search clinic by full name

- Given the patient is on the clinic search page
- When the patient enters the full clinic name in the search bar
- Then the system should display a list of clinics matching that name

Scenario 2: Search clinic by partial name

- Given the patient is on the clinic search page
- When the patient enters part of a clinic name in the search bar
- Then the system should display a list of clinics whose names begin with or contain the entered text

Scenario 3: No matching clinic found

- Given the patient is on the clinic search page
- When the patient enters a clinic name that does not exist
- Then the system should display a message indicating that no clinics were found


Add a staff member and assign them a clinic:

Scenario 1: Successfully add a staff member

- Given the admin is logged in and on the add staff page
- When the admin enters valid staff details and selects a clinic
- Then the system should create the staff member account and assign the staff member to the selected clinic

Scenario 2: Required fields are missing

- Given the admin is on the add staff page
- When the admin submits the form with missing required information
- Then the system should display validation messages and should not create the staff member account

Add an admin and give them admin permission:

Scenario 1: Successfully add an admin

- Given the current admin is logged in and on the add admin page
- When the admin enters valid details for a new admin user
- Then the system should create the new user and assign admin permissions

Scenario 2: Missing required details

- Given the current admin is on the add admin page
- When the admin submits the form without all required details
- Then the system should display validation errors and should not create the admin account

Scenario 3: New admin has admin access

- Given a new admin account has been created
- When that user logs into the system
- Then the user should have access to admin functionality

Log out of a profile:

Scenario 1: Successful logout

- Given the user is logged into their profile
- When the user clicks the logout button
- Then the system should log the user out and redirect them to the landing page

Search clinics by province:

Scenario 1: Search by province

- Given the patient is on the clinic search page
- When the patient selects a province
- Then the system should display a list of clinics located in that province

Scenario 2: No clinics in selected province

- Given the patient is on the clinic search page
- When the patient selects a province with no available clinics
- Then the system should display a message indicating that no clinics were found

Search clinics by facility type:

Scenario 1: Search by facility type

- Given the patient is on the clinic search page
- When the patient selects a facility type
- Then the system should display a list of clinics matching that facility type

Scenario 2: No clinics in selected facility type

- Given the patient is on the clinic search page
- When the patient selects a facility type with no available clinics
- Then the system should display a message indicating that no clinics were found

View and search for staff:

Scenario 1: View all staff

- Given the admin is logged in and on the admin page
- When the staff list is clicked
- Then the system should display a list of staff members

Scenario 2: Search for a staff member by name

- Given the admin is on the admin page
- When the admin enters a staff member’s name in the search bar of the staff list
- Then the system should display matching staff results

Scenario 3: No matching staff found

- Given the admin is on the admin page
- When the admin searches for a staff member in the staff list that does not exist
- Then the system should display a message indicating that no staff members were found

Make a booking:

Scenario 1: Successfully make a booking

- Given the patient is logged in and on the booking page
- When the patient selects a clinic, date, and available time slot and confirms the booking
- Then the system should create the booking and display a confirmation message

Scenario 2: Selected time slot is unavailable

- Given the patient is on the booking page
- When the patient selects a time slot that has already been booked
- Then the system should prevent the booking and display that the slot is unavailable

Scenario 3: Required booking details are missing

- Given the patient is on the booking page
- When the patient attempts to confirm a booking without selecting all required details
- Then the system should display validation messages and should not create the booking

Cancel a booking:

Scenario 1: Successfully cancel a booking

- Given the patient has an existing upcoming booking
- When the patient selects the cancel option and confirms cancellation
- Then the system should cancel the booking and display a confirmation message

Scenario 2: Cancelled booking is removed from active bookings

- Given the patient has cancelled a booking
- When the patient views their current bookings
- Then the cancelled booking should no longer appear as an active booking

Reschedule a booking:

Scenario 1: Successfully reschedule a booking

- Given the patient has an existing upcoming booking
- When the patient selects the reschedule option, chooses a new date and time, and confirms
- Then the system should update the booking and display a confirmation message

Scenario 2: New selected slot is unavailable

- Given the patient is rescheduling an existing booking
- When the patient selects a date and time slot that is already booked
- Then the system should prevent the reschedule action and display that the slot is unavailable

Scenario 3: Updated booking details are shown

- Given the patient has successfully rescheduled a booking
- When the patient views their booking details
- Then the system should display the new date and time for the booking

View total number of staff

- Given I am logged in as an admin, when I open the admin dashboard, then I should see a card displaying the total number of staff members in the system.
- Given there are staff records in the system, when the admin dashboard loads, then the total staff count shown must match the number of users with the role of clinic staff.
- Given there are no staff records in the system, when I open the admin dashboard, then the total staff count should display 0.
- Given the staff count cannot be retrieved from the database, when I open the admin dashboard, then an error message should be shown or the statistic should fail gracefully.

View total number of clinics:

- Given I am logged in as an admin, when I open the admin dashboard, then I should see a card displaying the total number of clinics in the system.
- Given clinic records exist in the system, when the admin dashboard loads, then the total clinics count shown must match the number of clinic records in the database.
- Given there are no clinic records in the system, when I open the admin dashboard, then the total clinics count should display 0.
- Given the clinic count cannot be retrieved from the database, when I open the admin dashboard, then an error message should be shown or the statistic should fail gracefully.
View number of appointments today
- Given I am logged in as an admin, when I open the admin dashboard, then I should see a card displaying the number of appointments scheduled for today.
- Given appointments exist for the current date, when the admin dashboard loads, then the appointments today count shown must match the number of appointments scheduled for today.
- Given there are no appointments scheduled for the current date, when I open the admin dashboard, then the appointments today count should display 0.
- Given some appointments for today have been cancelled, when the admin dashboard loads, then only appointments with an active booked status should be included in the appointments today count.
- Given the appointments count cannot be retrieved from the database, when I open the admin dashboard, then an error message should be shown or the statistic should fail gracefully.

## Task Allocation
- Aaliah: front-end for admin home page, functionality of admin home page
- Ammaarah: front end for staff home page, show password for signup and login, google logo, admin functionality
- Vareshan: front-end for patient page
- Muhammed: testing, Github testing, patient functionality
- Vikram: dataset
- Vikram, Vareshan, Muhammed: searching & finding closest clinic

