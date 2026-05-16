# Sprint 3 Planning

## Date
25 April 2026

## Team Members
- Aaliah Reddy (2798790)
- Muhammed Bayat (2811604)
- Ammaarah Mia (2807590)
- Vareshan Rajah (2809069)
- Vikram Mahalingam (2800630)

## Sprint Goal
Implement the staff functionality and some more admin functionality. Fix bugs.

### Frontend Development
- Staff home page

### Backend Development
- Admins can edit clinic hours
- Staff functionality

## User Stories
- As a patient, I can select a clinic to view the current queue so that I can see how busy the clinic is before deciding to join
- As a patient, I can join a clinic queue so that I can reserve my place before arriving or while waiting
- As a patient I can leave a queue so that I can cancel my place if I no longer want to wait
- As an admin, I can edit a clinics operating hours so that patients know when the clinic and queue services are available
- As an admin, I can view the recent activity of admin changes so that I can keep track of important system updates
- As a staff member, I can manage the queue so that I can update patient queue progress and keep the clinic flow organised
- As a staff member, I can create an appointment on a patients behalf so that patients who cannot book themselves can still receive appointment slots
- As a staff member, I can cancel an appointment on a patients behalf so that the appointment schedule remains accurate when a patient can no longer attend
- As a staff member, I can reschedule an appointment on a patients behalf so that patients can be moved to a more suitable date or time without losing their booking
- As an admin, I can remove a staff member so that I can revoke their access when they no longer work at a clinic or should no longer have staff permissions.


## User acceptance tests

View current queue:

Scenario 1: Display clinic queue information

- Given the patient is on the clinic selection page
- When the patient selects a clinic
- Then the system displays the clinic’s current queue information, including queue length, estimated wait time, and queue status

Scenario 2: No active queue available

- Given the selected clinic has no active queue
- When the patient views the clinic queue
- Then the system displays a message saying there is no active queue

Join a queue:

Scenario 1: Successfully join a queue

- Given the clinic queue is open
- When the patient clicks “Join Queue”
- Then the patient is added to the queue and their queue position and estimated wait time are displayed

Scenario 2: Prevent joining multiple queues

- Given the patient is already in an active queue
- When the patient tries to join another queue
- Then the system prevents them from joining and displays an error message

Leave a queue:

Scenario 1: Successfully leave a queue

- Given the patient has joined a queue
- When the patient clicks “Leave Queue”
- Then their queue entry is marked as cancelled and they are removed from the active queue

Scenario 2: Queue positions update after leaving

- Given the patient leaves the queue
- When the queue is refreshed
- Then the remaining patients’ queue positions are updated

Edit clinic operating hours:

Scenario 1: Successfully update clinic operating hours

- Given the admin is viewing a clinic’s operating hours
- When the admin changes the opening or closing time and clicks save
- Then the updated operating hours are saved and displayed to patients

Scenario 2: Invalid operating hours

- Given the admin enters a closing time before the opening time
- When the admin clicks save
- Then the system rejects the update and displays a validation error

View recent admin activity:

Scenario 1: Display recent admin activity

- Given admin changes have been made in the system
- When the admin views the recent activity tile
- Then the system displays the 3 most recent activities with the newest first

Scenario 2: Display staff activity message

- Given a staff member is added to a clinic
- When the recent activity tile is viewed
- Then it displays an activity message such as “{Name} added as staff member to {Clinic}”

Manage Queue:

Scenario 1: View current queue

- Given I am logged in as a staff member
- And I am assigned to a clinic
- When I open the queue management page
- Then I should see a list of patients currently in the queue for my clinic
- And each patient should display their queue status

Scenario 2: Update patient status

- Given I am viewing the queue management page
- And there is a patient with the status “waiting”
- When I update the patient’s status to “in progress”
- Then the patient’s queue status should change to “in progress”
- And the updated status should be saved successfully

Scenario 3: Remove completed patient from queue

- Given a patient has completed their consultation
- When I update their queue status to “completed”
- Then the patient should no longer appear as actively waiting in the queue
- And the clinic queue should update accordingly

Scenario 4: Prevent access to another clinic’s queue

- Given I am logged in as a staff member assigned to a specific clinic
- When I access the queue management page
- Then I should only see the queue for my assigned clinic
- And I should not be able to manage queues from other clinics

Create Appointment on Patient’s Behalf:

Scenario 1: Create appointment successfully

- Given I am logged in as a staff member
- And I have selected a patient
- And I have selected an available date and time slot
- When I submit the appointment booking
- Then the appointment should be created successfully
- And the patient should be assigned to the selected appointment slot

Scenario 2: Prevent double booking

- Given I am creating an appointment for a patient
- And the selected time slot is already booked
- When I attempt to submit the appointment
- Then the system should prevent the booking
- And I should see an error message explaining that the slot is unavailable

Scenario 3: Require appointment details

- Given I am creating an appointment on behalf of a patient
- When I submit the form without selecting a required field such as patient, clinic, date, or time
- Then the appointment should not be created
- And I should see a validation message explaining what is missing

Scenario 4: Appointment appears in schedule

- Given I have successfully created an appointment for a patient
- When I view the clinic appointment schedule
- Then the new appointment should appear in the correct date and time slot

Cancel Appointment on Patient’s Behalf:

Scenario 1: Cancel appointment successfully

- Given I am logged in as a staff member
- And I am viewing an existing appointment
- When I cancel the appointment
- Then the appointment status should change to “cancelled”
- And the appointment should no longer appear as an active booking

Scenario 2: Confirm cancellation before saving

- Given I am viewing an existing appointment
- When I click the cancel appointment button
- Then I should be asked to confirm the cancellation
- And the appointment should only be cancelled if I confirm

Scenario 3: Keep schedule accurate after cancellation

- Given an appointment has been cancelled
- When I view the appointment schedule
- Then the cancelled appointment slot should become available again
- Or the appointment should clearly show as cancelled, depending on the system design

Scenario 4: Prevent cancelling an already cancelled appointment

- Given an appointment already has the status “cancelled”
- When I try to cancel it again
- Then the system should prevent duplicate cancellation
- And I should see a message explaining that the appointment has already been cancelled

Reschedule Appointment on Patient’s Behalf:

Scenario 1: Reschedule appointment successfully

- Given I am logged in as a staff member
- And I am viewing an existing appointment
- And I select a new available date and time
- When I submit the reschedule request
- Then the appointment should be updated to the new date and time
- And the patient should keep the same booking record

Scenario 2: Prevent rescheduling to unavailable slot

- Given I am rescheduling an appointment
- And the new selected time slot is already booked
- When I submit the reschedule request
- Then the appointment should not be updated
- And I should see an error message explaining that the slot is unavailable

Scenario 3: Require new date and time

- Given I am rescheduling an appointment
- When I submit the reschedule form without selecting a new date or time
- Then the appointment should not be changed
- And I should see a validation message explaining that a new date and time are required

Scenario 4: Old slot becomes available

- Given an appointment has been successfully rescheduled
- When I view the appointment schedule
- Then the old appointment slot should become available
- And the appointment should appear in the new selected slot

Remove Staff Member:

Scenario 1: Successfully remove a staff member

- Given I am logged in as an admin
- And I am viewing the staff management page
- And there is an existing staff member in the staff list
- When I select the staff member and click “Remove”
- Then the staff member should be removed from the staff list
- And their staff access should be revoked successfully

Scenario 2: Confirm removal before deleting staff member

- Given I am logged in as an admin
- And I am viewing the staff management page
- When I click the remove button for a staff member
- Then I should be asked to confirm the removal
- And the staff member should only be removed if I confirm

Scenario 3: Removed staff member cannot access staff features

- Given a staff member has been removed by an admin
- When the removed staff member tries to access the staff dashboard
- Then the system should prevent access to staff-only features
- And the user should no longer be treated as a staff member

Scenario 4: Display success message after staff removal

- Given I am logged in as an admin
- And I have confirmed the removal of a staff member
- When the system successfully removes the staff member
- Then I should see a success message confirming that the staff member was removed

Scenario 5: Display error message if staff removal fails

- Given I am logged in as an admin
- And I have confirmed the removal of a staff member
- When the system fails to remove the staff member
- Then the staff member should remain in the staff list
- And I should see an error message explaining that the staff member could not be removed

## Task Allocation
- Aaliah & Ammarah: Admin page
- Ammaarah: staff button: needs to have staff and clinic, and a remove button and a scrollbar because the default should show all the staff members. The scrollbar for clinics. Remove staff functionality
- Aaliah: Edit clinic (operating hours), patients waiting board and recent activities board.
- Muhammed: Patient page (queueing system)
- Vikram: Staff queueing system (add or reschedule first)
- Vareshan: Staff queue UI
