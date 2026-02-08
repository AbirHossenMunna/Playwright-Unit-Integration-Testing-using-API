# Playwright Unit-Integration testing using API

### This project automates API testing for the DailyFinance platform using Playwright, covering unit and integration tests with dynamic data, API chaining, and full positive & negative flow validations..

### Features:
* API Chaining: Seamless flow where data from one request feeds into the next (e.g., login → create user → verify).
* Positive & Negative Flows: Full coverage for success and failure scenarios.
* Dynamic Data Handling: Random users generated via Faker to avoid collisions and test edge cases.
* Token & Session Management: Login once and reuse authorization token across multiple API calls.
* Allure Reporting: Detailed reports with logs, screenshots on failure, and step-by-step execution details.
* For failed test cases it will take a screenshot aswell at the point of failure.

### APIs Tested:

#### Auth
* Login with valid credentials
* Login with invalid credentials

#### User
* Create User – Add a new user with valid payload
* Get All Users – Support limit, pagination, and list verification
* Search User – Search by ID, email, or name
* Update User – Update user fields and verify persistence
* Delete User – Delete a user and confirm deletio

### Testing Approach:

* Unit Testing: Each API endpoint validated individually for expected responses.
* Integration Testing / API Chaining: End-to-end flows like Login → Create → Update → Delete → Verify to ensure API interactions work together.
* Dynamic Validation: Data returned from one step is used in subsequent steps to verify correctness.

### Technology:

* Framework: Playwright
* Language: JavaScript
* IDE: VS Code
* Reporting: Allure (optional)
* Package Manager: npm
* Browser Setup: npx playwright install

### Prerequisite:
* Need to install Node.js v18+ and npm
* (Optional) Install Allure for test reporting
* Configure environment variables if using .env for URL, tokens, or credentials
* Clone this project from GitHub
  
```bash
  git clone <repo_url>
```
* Open the project folder in VS Code or your preferred IDE
  
* Run npm install to install all project dependencies

```bash
  npm install
```
* Run npx playwright install to install browsers required by Playwright
 ```bash
  npx playwright install
```
* Click on Terminal and run the automation scripts using:
 ```bash
  npx playwright test
```
### Run the Automation Script by the following command:
* Playwright will open the browser and start automating.
  
```bash
  npx playwright test
```

### After automation to view allure report , give the following commands:

```bash
npm install -g allure-commandline --save-dev
```
* Check Version:
```bash
allure --version
```
* Generate Allure Report:
```bash
allure generate allure-results --clean
```
* Open Allure Report:
```bash
allure open allure-report
```
* Serve Allure Report Without Generating:
```bash
allure serve allure-results
```
### Here is the Normal report:
<img width="1908" height="913" alt="Screenshot 2026-02-08 235007" src="https://github.com/user-attachments/assets/7ea09736-8dc5-4fc8-a379-cb3444d4c7b1" />
<img width="1915" height="907" alt="Screenshot 2026-02-08 235021" src="https://github.com/user-attachments/assets/3c15f527-baa9-498d-acca-482df0ae6223" />

### Here is the OverView Allure report:
<img width="1909" height="920" alt="Screenshot 2026-02-08 235404" src="https://github.com/user-attachments/assets/bf8bc893-74b9-44bf-b0d7-9e923fec5cc2" />

### Here is the Graph report:
<img width="1919" height="925" alt="Screenshot 2026-02-08 235528" src="https://github.com/user-attachments/assets/f6537fd4-0ad9-4724-9d55-a531c2aa1c68" />

### Here are the allure suites of this project:
<img width="1914" height="913" alt="Screenshot 2026-02-08 235439" src="https://github.com/user-attachments/assets/f57092d2-005e-4e40-b4a2-3930a6e9f70b" />
<img width="1915" height="908" alt="Screenshot 2026-02-08 235455" src="https://github.com/user-attachments/assets/c340982b-e492-4589-9bfa-ea0f97e6f526" />

### Here are the Allure Behaviors of this project:
<img width="1903" height="922" alt="Screenshot 2026-02-08 235543" src="https://github.com/user-attachments/assets/ea7efb09-9f4b-4719-bec0-541fb09959f5" />
<img width="1903" height="910" alt="Screenshot 2026-02-08 235554" src="https://github.com/user-attachments/assets/9216b3f5-f705-41c5-890d-518827934dcc" />
