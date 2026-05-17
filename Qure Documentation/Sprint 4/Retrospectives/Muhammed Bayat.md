# Individual Sprint 4 Retrospective

## Name
Muhammed Bayat (GitHub: Muhammed-Bayat)

---

## Sprint Goal
The goal of Sprint 4 was to let admins set clinic operating times and make booking, rescheduling, and queue features follow those times.

---

## Sprint Outcome
Sprint 4 was successful. Admins can now set clinic opening and closing times. Patient and staff bookings now block unavailable hours, and queue availability matches the selected clinic’s hours.

If no custom times are set, the system defaults to 08:00–17:00. Staff can also view current day, upcoming, past, and cancelled bookings.

---

## Contributions and Commit History
My contributions can be traced through my GitHub commits under **Muhammed-Bayat**:

### 17 May 2026
- Added admin clinic time management
- Stored clinic times in the clinics table
- Used `NULL` times to default to 08:00–17:00
- Updated patient and staff booking/rescheduling to block unavailable hours
- Updated queue hours to match clinic hours
- Improved staff appointment views
- Fixed minor bugs

---

## Technical Decisions

### 1. Storing Clinic Times in the Clinics Table
Clinic times were stored directly in the clinics table because the times belong to each clinic and this kept the structure simple.

### 2. Default Clinic Hours
If clinic times are `NULL`, the system defaults to 08:00–17:00 so the app still works when custom hours are not set.

---

## What Went Well
- Clinic hours integrated well with existing booking and queue logic
- Appointment and queue availability became more realistic
- Staff appointment views became clearer
- There were no major issues

---

## Challenges Encountered
There were no major challenges. Most of the work involved replacing hardcoded times with clinic-specific operating hours.

---

## How Challenges Were Handled
I tested the logic across patient booking, staff booking, rescheduling, and queue availability, then fixed minor bugs during final polishing.

---

## Areas for Improvement
- Avoid hardcoding default values in multiple places
- Plan shared logic earlier
- Improve integration testing across patient and staff flows

---

## Reflection on Contribution
I rate my contribution as **8/10**.

My work made the system more realistic and flexible, but there was less to do than in previous sprints.

---

## Conclusion
Sprint 4 polished the system before final delivery by adding clinic-specific operating hours, blocking unavailable times, and improving staff appointment views.