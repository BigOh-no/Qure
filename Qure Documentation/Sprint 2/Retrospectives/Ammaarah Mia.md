Sprint Retrospective
Ammaarah Mia (2807590)

 Tasks Completed
During Sprint 2, I was responsible for:
- Adding the Google logo to the "Continue with Google" button on the Login and Signup pages
- Implementing a show/hide password toggle on the Login and Signup pages
- Designing and building the frontend UI for the Staff Dashboard
- Implementing staff and clinic search functionality on the Admin Dashboard
- Designing the Process View UML diagrams (activity diagram and sequence diagram) for the architectural documentation

 Work Timeline and Contributions
My first commits for this sprint were made on 15 April, where I added the Google logo to the "Continue with Google" button on both the Login and Signup pages, and implemented a show/hide password toggle on both pages. For the Google logo, I installed the `react-icons` library and used the `FcGoogle` icon component to replace the plain text button, bringing the UI in line with standard Google sign-in design conventions. For the password toggle, I introduced a `showPassword` state variable and used the `FaEye` and `FaEyeSlash` icons from `react-icons` to allow users to toggle password visibility. On the Signup page, I implemented two separate toggle states — one for the password field and one for the confirm password field — since both required independent visibility control. I also added the necessary CSS to both `Login.css` and `Signup.css` to position the eye icon correctly within the input field using a `password-wrapper` class with absolute positioning.

In parallel with these changes, I also built the full frontend UI for the Staff Dashboard. This involved creating `Staff-dashboard.js` and `staff.css` from scratch. The dashboard features a sidebar with navigation items and a logout button pinned to the bottom of the sidebar, a topbar displaying the clinic name, and a patient queue table showing each patient's name, appointment time, current status, and action buttons. I implemented the queue management logic using React state, including an `updateStatus` function that allows staff to mark patients as "In Consultation" or "Complete", and a `getStatusClass` function that dynamically applies colour-coded styling to each status badge. I styled the dashboard to match the team's red colour scheme and integrated the Qure logo into the sidebar. I also added responsive CSS so the layout adapts correctly on smaller screens, and updated the logout button styling to match the admin dashboard design after pulling from a teammate's branch.

On 18 April, I worked on the Admin Dashboard by adding staff and clinic search functionality. I integrated Supabase directly into the admin page by importing `supabaseClient` and writing live search queries that fire as the user types into the search bar. The staff search queries the `profiles` table filtering by the `clinicstaff` role, while the clinic search queries the `clinics` table using a case-insensitive `ilike` filter on the `facility_name` column. I handled real-world data quality issues in the clinics dataset, such as null `facility_name` values causing runtime errors, and resolved these by adding null checks to the filter logic. I also restructured the search interaction so that clicking the Staff or Clinics sidebar buttons opens a popup with an empty search bar, and results only appear as the user types, rather than loading all records upfront.

Also during this sprint, I was responsible for producing the Process View component of the team's software architecture documentation as part of the 4+1 architectural model. This involved designing a UML activity diagram using swim lanes to illustrate the high-level flow of activities across all three user roles — Patient, Clinic Staff, and Admin — including decision points such as slot availability during booking and status updates during queue management. I also produced a UML sequence diagram showing the interactions between actors and system components (the frontend, auth.js, and Supabase) across all major processes including authentication, appointment booking, queue management, and admin functionality. Producing these diagrams required a solid understanding of the system's architecture and the flow of data between components, and involved several iterations to ensure the correct level of abstraction was used.

 Challenges Experienced

- Positioning the eye icon correctly inside the password input field required using absolute positioning within a wrapper element, and finding a semantic HTML alternative to a `div` wrapper took some iteration
- The clinics dataset contained null values in the `facility_name` column which caused a runtime `TypeError` when the filter tried to call `toLowerCase()` on a null value, requiring a null guard to be added
- Resolving a merge conflict in `App.js` when creating the pull request for the admin search feature, as another branch had added new imports and routes that conflicted with mine
- Balancing multiple tasks across different branches and keeping them in sync with `main` required careful use of `git pull` and `git checkout` throughout the sprint

The first challenge was positioning the eye icon inside the password input field. I solved this by wrapping the input and the icon span together in a label element with the class password-wrapper, then using position: relative on the wrapper and position: absolute with right: 1rem and top: 50% on the eye icon so it sits flush inside the right edge of the input field. The second challenge was a runtime TypeError caused by null values in the facility_name column of the clinics dataset. I resolved this by adding a null guard to the filter condition — changing it to c.facility_name && c.facility_name.toLowerCase().includes(...) so that any clinic record with a null name is simply skipped rather than crashing the app. The third challenge was a merge conflict in App.js when I created my pull request, because a teammate's branch had added new imports and routes to the same file. I resolved this using GitHub's web editor by selecting "Accept both changes" so that both sets of imports and routes were preserved. The fourth challenge was managing multiple branches throughout the sprint and keeping them in sync with main. I handled this by regularly running git pull origin main before starting new work and using git checkout to switch between branches carefully, making sure I was always working on the correct branch before committing.



Reflection

This sprint was significantly more demanding than Sprint 1, both in the volume and complexity of work. Across the sprint I touched four different areas of the codebase — the Login page, the Signup page, the Staff Dashboard, and the Admin Dashboard — each requiring a different combination of UI work, state management, and Supabase integration. I became much more comfortable working with React hooks, particularly `useState` for managing multiple independent state variables, and gained hands-on experience querying a real Supabase database with live search. I also developed a better understanding of how to work collaboratively in a shared codebase, including resolving merge conflicts and coordinating with teammates before making changes that affect shared files like `App.js`.

The architectural discussions this sprint helped me understand how our frontend connects to Supabase as our backend, and how role-based routing from the auth layer feeds into each dashboard experience. My contributions this sprint fit into the overall system by completing the staff-facing side of the queue management feature, extending the admin's ability to monitor and search the workforce and clinic registry, and documenting the system's key processes through UML diagrams.

Areas for Improvement

- Running the app more frequently during development to catch errors like null value issues earlier rather than at the testing stage
- Communicating with teammates before making changes to shared files to reduce the likelihood of merge conflicts
- Breaking larger tasks into smaller, more frequent commits to create a cleaner and more incremental commit history
- Producing the UML diagrams earlier in the sprint rather than close to the review, to allow more time for review and iteration with the team

 Conclusion

Overall, Sprint 2 was a productive and challenging sprint in which I completed all of my assigned tasks and made meaningful contributions across multiple parts of the application. The work I delivered this sprint strengthens the patient facing and admin facing layers of the system and lays the groundwork for further feature development in Sprint 3.
