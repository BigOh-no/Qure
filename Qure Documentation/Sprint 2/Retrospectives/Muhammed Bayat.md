# Individual Sprint 2 Retrospective

## Name  
Muhammed Bayat (GitHub: Muhammed-Bayat)

---

## Sprint Goal  
The goal of this sprint was to:  
- Implement a clinic search feature using a real South African clinic dataset  
- Allow patients to search for clinics by name, province, and facility type  
- Develop backend logic for appointment management (booking, rescheduling, cancelling, and viewing)  
- Improve overall system integration between frontend and backend  

---

## Sprint Outcome  
The sprint was successful. All planned functionality was implemented and working correctly. Patients are now able to search for clinics using multiple filters and manage their appointments through booking, rescheduling, cancelling, and viewing features.

The system integrates a real clinic dataset and dynamically manages appointment availability. The team completed all user stories within a short one-week sprint and exceeded expectations.

---

## Contributions and Commit History  
My contributions can be directly traced through my GitHub commits:

### 15 April 2026  
- Implemented clinic search functionality using a real dataset  
- Added filtering by clinic name, province, and facility type  

### 17 April 2026  
- Developed backend logic for appointment booking  
- Implemented rescheduling functionality by reusing existing booking logic  
- Implemented cancellation functionality using a status-based approach  
- Ensured cancelled appointment slots become available again for booking  

---

## Technical Decisions  

### 1. Reusing Booking Logic for Rescheduling  
Instead of creating separate logic for rescheduling, the existing booking functionality was reused.

**Justification:**  
- Reduced code duplication  
- Ensured consistency in validation and slot handling  
- Simplified maintenance and debugging  

---

### 2. Status-Based Cancellation (Soft Delete)  
Appointments are not deleted from the database when cancelled. Instead, their status is updated to `"cancelled"`.

**Justification:**  
- Preserves historical data for analytics and auditing  
- Maintains data integrity  
- Allows cancelled time slots to be reused without losing records  

---

### 3. Dynamic Slot Availability  
When an appointment is cancelled, the time slot becomes available again for other users.

**Justification:**  
- Ensures efficient utilisation of appointment slots  
- Reflects real-world booking systems  
- Prevents unnecessary blocking of time slots  

---

## What Went Well  
- The clinic search functionality was implemented successfully using a real dataset  
- Appointment management features (book, reschedule, cancel, view) worked reliably  
- Reusing logic improved development speed and consistency  
- Strong collaboration within the team  
- The sprint was completed within a short timeframe with all user stories achieved  

---

## Challenges Encountered  
- Handling cancellation logic while preserving the record and freeing the time slot  
- Browser-based confirmation popups caused usability issues on mobile devices  
- Maintaining consistent behaviour across booking and rescheduling  

---

## Key Learnings  

### Technical:  
- How to work with real datasets and implement filtering logic  
- How to design backend logic for full CRUD-style appointment systems  
- Importance of soft deletion instead of permanent deletion  
- How to reuse existing logic to improve efficiency and consistency  

### Team and Process:  
- Collaboration improves integration between system components  
- Short sprints require clear focus and efficient execution  
- Supporting teammates improves overall team performance  

---

## Areas for Improvement  

### Individual Improvements:  
- Replace browser popups with custom modal components  
- Improve mobile responsiveness and UI/UX  
- Refine frontend interactions for a smoother experience  

### Team Improvements:  
- Allocate more time to complex features  
- Plan ahead for queue management and staff functionality  

---

## Reflection on Contribution  
I rate my contribution as **10/10**.  

- I completed all assigned tasks  
- I implemented core system functionality  
- I ensured correctness in real-world scenarios  
- I collaborated effectively with my team  

---

## Conclusion  
Sprint 2 successfully expanded the system by introducing clinic search functionality and a complete appointment management workflow. The application is now more realistic and scalable, providing a strong foundation for queue management and real-time features in future sprints.