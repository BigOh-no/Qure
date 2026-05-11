# Sprint 3 Retrospective

## Name
Muhammed Bayat (GitHub: Muhammed-Bayat)

---

## Sprint Goal
The main goal of this sprint was to implement the queuing feature for the application.

This included allowing patients to search for clinics, view the current queue at a selected clinic, join a queue, view their position and estimated waiting time, and leave the queue when necessary. The sprint also included implementing the view all appointments page so that users could view and sort their appointment history.

---

## Sprint Outcome
Sprint 3 was successful. Although this was a longer sprint, the team managed to implement the remaining core functionality needed for the application.

The queuing feature was implemented successfully and integrated with the patient dashboard. Patients can now search for a clinic, view the clinic queue, join the queue, and track their position and estimated waiting time from the dashboard. They are also able to leave the queue if they no longer want to wait.

The sprint also included the implementation of the view all appointments page, which allows users to view appointments across different statuses, including cancelled, finished, and upcoming appointments. Users can also sort appointments by status or by date in ascending or descending order.

Overall, Sprint 3 helped make the application feel much more complete and closer to a real-world healthcare queue and appointment management system.

---

## Contributions and Commit History
My contributions can be directly traced through my GitHub commits under the username **Muhammed-Bayat**:

### 1 May 2026
- Implemented the core queue functionality
- Allowed patients to search for clinics using the same clinic search functionality from the booking appointments page
- Enabled patients to select a clinic and view the current queue
- Added estimated waiting time functionality
- Implemented the ability for patients to join a clinic queue
- Added restrictions so that a patient can only join one queue at a time
- Added queue operating hours from 08:00 to 17:00

### 7 May 2026
- Improved the queue user interface
- Integrated the queue feature with the patient dashboard
- Displayed the patient’s current queue, queue position, and estimated waiting time on the dashboard
- Implemented the ability for patients to leave a queue
- Implemented the view all appointments page
- Displayed appointments with different statuses, including cancelled, finished, and upcoming appointments
- Added sorting functionality by status and by ascending or descending date order

### 10 May 2026
- Fixed bugs in the queue and appointment functionality
- Made final UI and logic adjustments
- Improved the overall stability and usability of the implemented features

---

## Technical Decisions

### 1. Reusing Clinic Search Functionality
The queue feature reused the same clinic searching functionality from the booking appointments page.

**Justification:**
- Ensured consistency across the application
- Reduced duplicated code
- Made the queue page feel familiar to users
- Improved maintainability because clinic search logic only needed to follow one consistent approach

---

### 2. Restricting Patients to One Active Queue
Patients were restricted to joining only one queue at a time.

**Justification:**
- Prevents unrealistic queue behaviour
- Avoids duplicate active queue entries for the same patient
- Keeps queue position and estimated waiting time accurate
- Improves data integrity in the system

---

### 3. Queue Operating Hours
Queues were limited to operating between 08:00 and 17:00.

**Justification:**
- Reflects realistic clinic operating hours
- Prevents patients from joining queues when clinics are closed
- Makes the queuing system more practical and controlled

---

### 4. Displaying Queue Information on the Patient Dashboard
After joining a queue, patients are redirected to the patient dashboard where their current queue, position, and estimated waiting time are displayed.

**Justification:**
- Gives patients a clear place to track their queue status
- Improves user experience by avoiding unnecessary navigation
- Makes the dashboard more useful and personalised

---

### 5. Keeping Appointment Records Instead of Hiding Them
The view all appointments page shows appointments across multiple statuses, including cancelled, finished, and upcoming appointments.

**Justification:**
- Gives users a complete appointment history
- Improves transparency
- Supports better record keeping
- Makes the system feel more realistic and reliable

---

## What Went Well
- The core queue functionality was implemented successfully
- The clinic search feature was reused effectively from the booking appointments page
- Patients can now view clinic queues before joining
- Queue position and estimated waiting time were displayed clearly
- Patients can leave a queue if they no longer want to wait
- The patient dashboard was improved by showing the current queue information
- The view all appointments page was implemented successfully
- Sorting appointments by status and date improved usability
- The team worked well in parallel because the system logic was separated clearly
- Most team members were able to work on separate parts of the application without blocking each other

---

## Challenges Encountered
There were no major issues during this sprint. Most of the sprint went smoothly because the project had been structured well and the team had separated responsibilities clearly.

The only minor challenge was that some team members depended on the queue functionality being completed first before they could fully continue with their own work. For example, Vikram had to wait for the core queue functionality to be pushed before continuing with his related work.

There were also minor bugs and final adjustments that needed to be handled near the end of the sprint, but these were resolved before the sprint was completed.

---

## How Challenges Were Handled
The challenges were handled through clear task separation and communication within the team.

Once the core queue functionality was completed and pushed, other team members were able to continue with their related work. Minor bugs were fixed during the final stages of the sprint, and the team focused on polishing the system before completion.

Because the application logic was separated well, team members were able to work independently without constantly waiting on each other. This made the sprint more efficient and showed the value of following Agile development practices.

---

## Areas for Improvement

### Individual Improvements:
- Push core functionality earlier so that teammates who depend on it can continue sooner

### Team Improvements:
- Identify task dependencies earlier during sprint planning
- Prioritise shared or blocking features earlier in the sprint
- Continue separating logic clearly so that team members can work independently
- Carry out integration testing earlier to catch final bugs sooner
- Keep improving communication around features that affect multiple team members

---

## Reflection on Contribution
I rate my contribution as **10/10**.

- I implemented the core queuing functionality, which was one of the main features of the application
- I reused and integrated clinic search functionality effectively
- I added restrictions to ensure patients can only join one queue at a time
- I integrated queue information with the patient dashboard
- I implemented the ability for patients to leave a queue
- I implemented the view all appointments page with sorting functionality
- I fixed bugs and made final adjustments before the sprint ended
- My work contributed directly to completing the remaining core functionality of the system

---

## Conclusion
Sprint 3 was an important sprint because it completed one of the main features of the application: the queuing system. The sprint added realistic queue management functionality, improved the patient dashboard, and gave users a complete view of their appointments.

Although the sprint was long, it was successful because the team managed to implement the remaining core features needed for the application. The clear separation of logic allowed team members to work efficiently and independently, which reflected good Agile development practice.

Overall, Sprint 3 made the system more complete, practical, and ready for final delivery.