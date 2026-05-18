Individual Sprint Retrospective
Name
Ammaarah Mia (2807590)
Tasks Completed
•	Fixed remove staff functionality (foreign key constraint error)
•	Updated Process View UML diagrams 
Work Timeline and Contributions
During this sprint, I worked on fixing a bug in the removeStaff functionality and updating the Process View UML diagrams. The remove staff feature was failing because deleting a staff member from the profiles table violated a foreign key constraint linked to the clinicStaff table. To solve this, I first investigated the Supabase error logs and traced the issue to the relationship between the two tables. I then updated the function so that it first retrieved the staff member’s profile id, deleted the related record from the clinicStaff table, and only afterwards removed the corresponding record from the profiles table. This ensured that the deletion process followed the correct order and prevented database constraint errors.
In addition to the bug fix, I updated the activity and sequence diagrams in the Process View UML documentation. 
Challenges Experienced
•	Diagnosing the foreign key constraint error required carefully analysing the Supabase error messages and understanding the relationships between the profiles and clinicStaff tables.
•	It was initially unclear which table needed to be updated first during the deletion process. I resolved this challenge by reviewing the database structure and testing the delete operations step by step until the correct sequence was identified.
Conclusion
Both tasks were completed successfully during the sprint. The remove staff functionality now works end-to-end without errors, and the updated UML diagrams accurately represent the system processes and interactions.

