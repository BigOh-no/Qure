## User acceptance tests

View Clinic Analytics:

Scenario 1: Display clinic analytics

- Given the admin is logged into the system
- When the admin navigates to the clinic analytics page
- Then the system displays clinic analytics information including patient statistics, queue statistics, and appointment statistics

Scenario 2: Prevent non-admin access

- Given the user is not an admin
- When the user attempts to access the clinic analytics page
- Then the system prevents access and displays an authorization error message

Scenario 3: Display message when no analytics data exists

- Given there is no analytics data available for a clinic
- When the admin views the clinic analytics page
- Then the system displays a message indicating that no analytics data is available


Export Clinic Analytics:

Scenario 1: Export clinic analytics as a CSV file

- Given the admin is logged into the system
- When the admin navigates to the clinic analytics page and selects the export CSV option
- Then the system downloads a CSV file containing the clinic analytics data

Scenario 2: Export clinic analytics as a PDF file

- Given the admin is logged into the system
- When the admin navigates to the clinic analytics page and selects the export PDF option
- Then the system downloads a PDF report containing the clinic analytics data

Scenario 3: Prevent non-admin access to exports

- Given the user is not an admin
- When the user attempts to access the clinic analytics export functionality
- Then the system prevents access and displays an authorization error message

Scenario 4: Export accurate analytics data

- Given the admin is logged into the system
- When the admin exports the clinic analytics as a CSV or PDF file
- Then the exported file contains the same analytics data displayed on the clinic analytics page


Reset Forgotten Password:

Scenario 1: Successfully request password reset

- Given the user is on the login page
- When the user selects “Forgot Password” and enters a registered email address
- Then the system sends a password reset email to the user

Scenario 2: Successfully reset password

- Given the user has received a password reset email
- When the user follows the reset link and enters a new valid password
- Then the system updates the user’s password successfully

Scenario 3: Invalid email address entered

- Given the user enters an email address that is not registered
- When the user submits a password reset request
- Then the system displays an error message explaining that the email address does not exist


Change Username:

Scenario 1: Successfully change username

- Given the user is logged into their account
- When the user enters a new valid username and clicks save
- Then the system updates and displays the new username successfully

Scenario 2: Prevent invalid username update

- Given the user is changing their username
- When the user enters an empty or invalid username
- Then the system rejects the update and displays a validation error message

Scenario 3: Updated username persists

- Given the user has successfully updated their username
- When the user refreshes the page or logs in again
- Then the updated username remains displayed on the account


Change Password:

Scenario 1: Successfully change password

- Given the user is logged into their account
- When the user enters their current password and a valid new password
- Then the system updates the password successfully

Scenario 2: Incorrect current password entered

- Given the user is attempting to change their password
- When the user enters an incorrect current password
- Then the system prevents the password change and displays an error message

Scenario 3: Weak password validation

- Given the user is changing their password
- When the user enters a password that does not meet password requirements
- Then the system rejects the password and displays a validation error message


Check Patient In:

Scenario 1: Check in a patient

- Given the staff member is logged into the system
- When the staff member selects a booked patient appointment and clicks the check-in button
- Then the system updates the patient’s appointment status to checked in

Scenario 2: Record patient arrival

- Given the staff member has checked in a patient
- When the appointment record is viewed
- Then the system shows that the patient has arrived for their appointment

Scenario 3: Prevent checked-in patients from being marked as no-shows

- Given a patient has been checked in for their appointment
- When the system calculates no-show information
- Then the checked-in patient is not counted as a no-show