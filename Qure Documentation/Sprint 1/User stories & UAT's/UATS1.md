## User acceptance tests

View landing page:

Scenario 1: Landing page loads successfully

- Given I am a visitor
- When I open the application
- Then I should see the landing page

Scenario 2: Landing page shows application information

- Given I am on the landing page
- When the page is displayed
- Then I should see information describing the application

Scenario 3: Visitor can navigate to login page

- Given I am on the landing page
- When I click the “Login” button
- Then I should be redirected to the login page

Scenario 4: Visitor can navigate to sign-up page

- Given I am on the landing page
- When I click the “Sign Up” button
- Then I should be redirected to the sign-up page

Access sign-up page:

Scenario 1: Sign-up page is accessible from landing page

- Given I am on the landing page
- When I click the “Sign Up” button
- Then I should be taken to the sign-up page

Scanerio 2: Sign-up page displays registration form

- Given I am on the sign-up page
- When the page loads
- Then I should see the fields required to create an account

Scenario 3: Sign-up page displays Google registration option

- Given I am on the sign-up page
- When the page loads
- Then I should see an option to sign up with Google

Manual sign-up:

Scanerio 1: Patient can submit a valid sign-up form

- Given I am on the sign-up page
- When I enter valid registration details and click “Sign Up”
- Then my account should be created successfully

Scenario 2: New patient account is stored in the system

- Given I have entered valid registration details
- When I complete the sign-up process
- Then my account information should be stored in the system

Scenario 3: Required fields must be completed

- Given I am on the sign-up page
- When I leave one or more required fields empty and click “Sign Up”
- Then I should see a validation message and the account should not be created

Scenario 4: Invalid email format is rejected

- Given I am on the sign-up page
- When I enter an invalid email address and click “Sign Up”
- Then I should see an error message and the account should not be created

Scenario 5: Duplicate account is prevented

- Given an account with my email already exists
- When I try to sign up using the same email
- Then I should see an error message and the new account should not be created

Register using google:

Scenario 1: Google sign-up option is available

- Given I am on the sign-up page
- When the page is displayed
- Then I should see a “Sign Up with Google” option

Scenario 2: Patient can register with Google successfully

- Given I am on the sign-up page
- When I click “Sign Up with Google” and complete Google authentication successfully
- Then my account should be created successfully

Scenario 3: Google account is stored in the system

- Given I successfully authenticate with Google
- When the registration process completes
- Then my account details should be stored in the system

Scenario 4: Failed Google authentication does not create an account

- Given I am registering with Google
- When Google authentication fails or is cancelled
- Then my account should not be created and I should see an appropriate message

Access login page:

Scenario 1: Login page is accessible from landing page

- Given I am on the landing page
- When I click the “Login” button
- Then I should be taken to the login page

Scenario 2: Login page displays login form

- Given I am on the login page
- When the page loads
- Then I should see the fields required to log into my account

Scenario 3: Login page shows available authentication methods

- Given I am on the login page
- When the page loads
- Then I should see the available login options

Patient login:

Scenario 1: Patient can log in with valid credentials

- Given I am a registered patient
- When I enter valid login credentials and click “Login”
- Then I should be logged in successfully

Scenario 2: Patient is redirected to patient home page

- Given I am a registered patient
- When I log in successfully
- Then I should be redirected to the patient home page

Scenario 3: Invalid patient credentials are rejected

- Given I am on the login page
- When I enter incorrect patient login details and click “Login”
- Then I should see an error message and should not be logged in

Scenario 4: Empty login fields are not accepted

- Given I am on the login page
- When I leave required login fields empty and click “Login”
- Then I should see a validation message and should not be logged in

Staff login:

Scenario 1: Staff member can log in with valid credentials

- Given I am a registered staff member
- When I enter valid login credentials and click “Login”
- Then I should be logged in successfully

Scenario 2: Staff member is redirected to staff home page

- Given I am a registered staff member
- When I log in successfully
- Then I should be redirected to the staff home page

Scenario 3: Invalid staff credentials are rejected

- Given I am on the login page
- When I enter incorrect staff login details and click “Login”
- Then I should see an error message and should not be logged in

Scenario 4: Unauthorized users cannot access staff page through staff login flow

- Given I am not a staff member
- When I attempt to log in through the system
- Then I should not be granted access to the staff home page

Admin login:

Scenario 1: Admin can log in with valid credentials

- Given I am a registered admin
- When I enter valid login credentials and click “Login”
- Then I should be logged in successfully

Scenario 2: Admin is redirected to admin home page

- Given I am a registered admin
- When I log in successfully
- Then I should be redirected to the admin home page

Scenario 3: Invalid admin credentials are rejected

- Given I am on the login page
- When I enter incorrect admin login details and click “Login”
- Then I should see an error message and should not be logged in

Scenario 4: Unauthorized users cannot access admin page through admin login flow

- Given I am not an admin
- When I attempt to log in through the system
- Then I should not be granted access to the admin home page