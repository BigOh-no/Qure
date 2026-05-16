# Individual Sprint 1 Retrospective

## Name
Subramanian Subramanian Mahalingam (GitHub: Vikram0501)

## Sprint Goal
The goal of this sprint was to:
- Implement Login and Signup Functionality
- Contribute to backend development in `auth.js`
- Connect to supabase and manage tables and RLS
- Set up google Oauth to allow for google integration

---

## Sprint Outcome

The sprint outcome was successful all deliverables were completed with time to debug

---

## Contributions and Commit History

My contributions can be traced through the GitHub commit history with username **Vikram0501**

- **2 April 2026**
  - Added the first iteration of functionality to the signup page and merged it to main
  - created the `supabaseClient.js` file to connect to supabase
  - created the `auth.js` file to handle authentication in the backend

- **8 April 2026**
  - Fixed all major bugs with login,signup and google authinticaiton

- **12 April 2026**
  - Fixed errors that arose after deployment to azure
  - merged all working functionality only the main production branch

---

## Technical Decisions

All API calls were moved to the backend files (auth.js and AuthCallback.js)

### Justification:
- Prevents access to sensitive information from the frontend (thereby increasing security)
- Streamlining testing by seperating having all essential backend functionality together

Overall this seperation helps the system become far more scalable and robust

---

## What Went Well

- Learned from experience which will help in later functional implementation
- Communication between the team was fanstastic, which helped moral and kept work progressing efficiently
- Integration with supabase and google oauth was relatively easy

---

## Challenges Encountered

My main challenges were with the actual implementation of login and signup functionality:

- **Auth Callback Rerouting**
  - One of my major challenges was with implementing callback functionality when it came to google login/signup and signup with email confirmation
  - Took a lot of debugging to figure out the correct triggers and data pipeline

- **RLS issues with supabase**
  - Creating RLS policies for the table on supabase took a lot of fine tuning and creating issues when signing up

---

## Key Learnings

### Technical:
- How to setup third party services
- How to connect through APIs
- How to implement authentication using APIs

### Team and Process:
- Importance of collaboration and communication
- Keeping elements standard across workspaces to keep code clean

---

## Areas for Improvement

### Individual Improvements:
- Should have planned triggers and data pipelines ahead of time
- Write cleaner code to improve readability

### Team Improvements:
- Split up the work so everyone has the chance to become familiar with both frontend and backend
---

## Reflection on Contribution

I rate my contribution as **9/10**.

- I completed all assigned tasks but could have done it cleaner and more efficiently

---

## Conclusion

Sprint 1 was successful and was a great learning experience, I believe going forward workflow will become more streamlined and productivity will increase now that the team is more familiar with our tools.