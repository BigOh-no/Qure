Individual Sprint Retrospective
Ammaarah Mia (2807590)
Tasks Completed
During Sprint 3, I was responsible for implementing the remove staff functionality on the Admin Dashboard, adding scrollbars to the staff and clinic list popups, and updating the Process View UML diagrams to reflect Sprint 3 features.
Work Timeline and Contributions
On 29 April, I improved the usability of the Admin Dashboard popups by adding scrollbars to the staff and clinic lists using max-height and overflow-y: auto in the .activity-list CSS class. I also styled each staff item with a .staff-list-item class so the email and remove button appeared side by side using flexbox.
On 9 May, I implemented the remove staff functionality by creating a removeStaff function that deletes a staff member from the profiles table in Supabase using their email. I added a staffToRemove state variable and a confirmation dialog to prevent accidental deletions. Once confirmed, the staff member is removed from both Supabase and the displayed list immediately without requiring a page refresh.
During the same sprint, I resolved a merge conflict in Admin-dashboard.js caused by overlapping changes between my work and a teammate’s edit clinic feature. I used the VS Code merge editor to accept both sets of changes. I also updated the activity and sequence UML diagrams to reflect the new Sprint 3 functionality.
Challenges Experienced
•	Resolving a merge conflict in Admin-dashboard.js where a teammate’s edit clinic variables clashed with my staffToRemove variable.
•	Coordinating work on a shared branch required frequent use of git pull before pushing changes to avoid conflicts and rejected pushes.
Reflection
This sprint improved my confidence working with React state management, Supabase integration, and Git merge conflict resolution. Updating the UML diagrams also strengthened my understanding of the system architecture.
A design decision I contributed to was using a staffToRemove variable instead of a generic boolean for the confirmation dialog. This allowed the dialog to display the exact email address being removed, improving clarity and reducing mistakes.
Areas for Improvement
In future sprints, I would like to commit changes more incrementally to create a cleaner commit history. I also need to communicate more with teammates before working on shared files and start tasks earlier to allow more time for testing.
Conclusion
Overall, I completed my Sprint 3 tasks successfully and contributed to both the system functionality and UML documentation. The remove staff feature is fully implemented with confirmation prompts and live UI updates, and the UML diagrams accurately reflect the system across all three sprints.

