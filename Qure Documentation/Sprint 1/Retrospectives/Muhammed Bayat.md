# Individual Sprint 1 Retrospective

## Name
Muhammed Bayat (GitHub: Muhammed-Bayat)

## Sprint Goal
The goal of this sprint was to:
- Implement unit tests for login and sign-up functionality
- Contribute to backend development in `auth.js`
- Set up Continuous Integration using GitHub Actions
- Deploy the application on Microsoft Azure

To support reliable testing, a mock Supabase client was used to simulate database interactions.

---

## Sprint Outcome

The sprint was successful. All planned work was completed and the team progressed through all key Scrum phases:
- Sprint Planning
- Sprint Execution
- Daily Scrums
- Sprint Review (implicit through completed features)
- Sprint Retrospective

All core deliverables, including authentication logic, testing, CI setup, and deployment, were achieved.

---

## Contributions and Commit History

My contributions can be directly traced through my GitHub commits under the username **Muhammed-Bayat**:

- **3 April 2026**
  - Fixed bugs in `supabaseClient.js` and `auth.js`
  - Implemented unit tests for login and sign-up functionality using Jest

- **8 April 2026**
  - Created `ci.yml` file to configure GitHub Actions for automated testing

- **12 April 2026**
  - Refined test case logic for improved accuracy
  - Worked on deployment of the application to Microsoft Azure

---

## Technical Decisions

A mock Supabase client was used instead of the live service for testing.

### Justification:
- Ensured unit tests remained independent of external systems
- Improved test reliability and speed in CI pipelines
- Prevented failures caused by network or authentication issues

This aligns with best practices in software testing, where unit tests should isolate application logic rather than depend on external APIs.

---

## What Went Well

- Strong collaboration within the team, particularly on frontend integration
- Backend development progressed efficiently with clear task division
- Successful implementation of GitHub Actions for automated testing
- Gained practical experience in deploying applications to Azure

---

## Challenges Encountered

The main challenges were related to CI/CD and deployment:

- **GitHub Actions instability**
  - When new dependencies were added, the CI pipeline would break due to configuration mismatches
  - Required manual fixes to the workflow file

- **Deployment issues on Azure**
  - Code that worked locally often failed in the deployed environment
  - Highlighted differences between local and production environments

- **Late-stage testing pressure**
  - Testing and debugging were concentrated towards the end of the sprint
  - Resulted in time pressure before the deadline

---

## Key Learnings

### Technical:
- How to configure and use GitHub Actions for CI/CD
- How to write unit tests using Jest
- How to structure backend authentication logic
- How to deploy a web application on Microsoft Azure
- How to use GitHub Projects for task tracking

### Team and Process:
- Importance of trusting teammates while still reviewing shared code
- Value of understanding the full system to identify integration issues
- Need to align development practices across team members

---

## Areas for Improvement

### Individual Improvements:
- Begin testing earlier in the sprint rather than leaving it towards the end
- Improve debugging efficiency in CI/CD environments

### Team Improvements:
- Standardize dependency management to prevent CI pipeline failures
- Develop with deployment in mind, not just local execution
- Introduce earlier integration testing to catch deployment-related issues sooner

---

## Reflection on Contribution

I rate my contribution as **10/10**.

- All assigned tasks from Sprint Planning were completed
- Contributed to both development and DevOps aspects of the project
- Took responsibility for critical components such as CI/CD and deployment
- Assisted in debugging and improving system reliability

---

## Conclusion

Sprint 1 was a valuable learning experience that introduced several new tools and concepts, particularly in testing and deployment. While challenges were encountered, especially with CI/CD and Azure, these provided important insights that will improve performance in future sprints. The team successfully delivered all planned functionality and established a strong foundation for subsequent development.