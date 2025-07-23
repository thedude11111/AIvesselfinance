Project Plan: AI-Powered Vessel Purchasing & Financial Analysis App
1. Project Overview & Vision
The project is to develop a sophisticated web application that simplifies the financial analysis of vessel acquisitions. The core innovation is an AI-powered chatbot (using the Gemini API) that allows users to define investment parameters through natural language. These parameters feed into a robust financial model, with the results presented in clear, interactive visualizations (graphs, tables). The platform will be secure, user-friendly, and require Google-based authentication for personalized use.

2. Core User Flow
Authentication: User visits the landing page and signs in using their Google account.

Initiate Analysis: User is directed to the main dashboard and starts a new "Vessel Analysis" session.

AI Chat Interaction: The user interacts with the AI chatbot.

Example: "I'm looking at a 10-year-old Panamax bulk carrier, around 82,000 DWT. The asking price is $22 million. I can put down 30% and want to finance the rest over 7 years at an estimated 6.5% interest rate."

Parameter Confirmation: As the user provides information, the extracted parameters (Vessel Type, Age, Price, Down Payment, etc.) are displayed in a structured form next to the chat window for real-time review and manual adjustment.

Run Model: Once all required parameters are set, the user clicks "Calculate" or "Run Analysis."

Visualize Results: The backend processes the data through the financial model. The user is then redirected to a results dashboard displaying:

Key metrics (NPV, IRR, Payback Period).

Interactive charts (e.g., Annual Cash Flow, Debt Service Coverage Ratio).

Detailed data tables (e.g., Pro-forma Income Statement, Amortization Schedule).

AI Q&A on Results: The user can ask the chatbot follow-up questions about the results.

Example: "What's the biggest driver of the negative cash flow in year 4?" or "What would the IRR be if the daily charter rate increased by 10%?"

3. Technology Stack
Frontend: React (with Vite for speed), Tailwind CSS for styling, Recharts or D3.js for data visualization.

Backend: Node.js with Express.js for the API server.

Database: Google Firestore (for its seamless integration with Firebase Authentication and real-time capabilities).

Authentication: Firebase Authentication with Google Provider (OAuth 2.0).

AI Integration: Google AI Gemini API (via REST API calls from the backend).

Deployment: Vercel for the frontend, Google Cloud Run or Heroku for the backend.

4. Frontend Architecture
SignInPage.js: A clean, simple page with a single "Sign in with Google" button.

MainApp.js: The core workspace component, divided into two main panels:

ChatbotPanel.js:

Displays the conversation history.

Contains the text input for interacting with the AI.

Manages the state of the conversation.

ParametersPanel.js:

Displays the financial model inputs as a structured form.

Fields are populated/updated based on the AI's JSON output.

Allows for manual override and fine-tuning of all parameters.

Includes the "Run Analysis" button.

ResultsDashboard.js:

Displays all outputs from the financial model.

Uses components like <CashFlowChart />, <MetricsSummary />, <DataTable />.

Components are interactive (e.g., tooltips on charts).

State Management: React Context or Zustand for managing global state like user authentication, chatbot conversation, and financial parameters.

5. Backend Architecture
API Server (Node.js/Express):

POST /api/auth/google: Handles the token received from Firebase on the frontend to create a user session.

POST /api/chatbot:

Receives the user's message from the frontend.

Sends the conversation history and a carefully engineered prompt to the Gemini API.

Receives the structured JSON response from Gemini.

Returns the AI's natural language response and the JSON data to the frontend.

POST /api/financial-model/calculate:

Receives the final, validated parameters from the frontend.

Executes the financial model logic.

Saves the inputs and results to the database under the user's ID.

Returns the calculated results as a JSON object.

POST /api/chatbot/query-results:

Receives a user's question about a specific analysis.

Fetches the results of that analysis from the database.

Sends the question and a summary of the results to Gemini for contextual analysis.

Returns the AI's answer to the frontend.

6. Database Design (Firestore)
users collection:

Document ID: user_id (from Firebase Auth)

Fields: email, displayName, createdAt.

analyses collection:

Document ID: analysis_id (auto-generated)

Fields:

userId: (links back to the user)

analysisName: (e.g., "Panamax Acquisition Scenario 1")

createdAt: timestamp

parameters: A map (object) containing all the inputs used for the calculation (price, age, loanTerm, etc.).

results: A map (object) containing all the outputs (NPV, IRR, cashFlows array, etc.).

7. AI Chatbot Integration (Gemini)
Primary Goal: Convert natural language into a structured JSON object for the financial model.

Prompt Engineering: The backend will use a system prompt to guide Gemini.

System Prompt Example: "You are a financial analyst specializing in maritime assets. The user will describe a vessel purchase scenario. Your task is to extract the key financial parameters from their message and return them as a JSON object. The required parameters are: vesselType, age, price, dwt (in metric tonnes), currency, downPaymentPercent, loanTermYears, interestRatePercent, dailyCharterRate, opexPerDay, utilizationPercent, and scrapValue. If a parameter is not mentioned, set its value to null. Always respond with a JSON object inside a json block, and provide a brief, conversational text confirmation."

Functionality:

Parameter Extraction: The primary function described above.

Contextual Q&A: The backend will provide the model's output data back to Gemini when the user asks a question about the results, enabling informed answers.

Scenario Modification: The user can ask to tweak parameters for a new calculation (e.g., "What if the interest rate was 7%?"). The backend reruns the model with the single changed parameter.

8. The Financial Model (Core Logic)
This model will be a function or class on the backend that accepts the parameters object and returns the results object.

Inputs (from parameters object):

Vessel Details: price, age, scrapValue, dwt.

Financing: downPaymentPercent, loanTermYears, interestRatePercent.

Revenue: dailyCharterRate, utilizationPercent (number of operating days per year / 365).

Operating Costs (OpEx): opexPerDay (includes crew, maintenance, insurance, stores, etc.).

Analysis Horizon: A fixed period, e.g., 10 years or the life of the loan.

Discount Rate: For NPV calculation (can be a standard input, e.g., 10%).

Calculations:

Initial Investment (Year 0 Outflow): price * downPaymentPercent.

Loan Amount: price * (1 - downPaymentPercent).

Annual Loan Repayment: Standard amortization calculation for principal and interest.

Annual Gross Revenue: dailyCharterRate * 365 * utilizationPercent.

Annual OpEx: opexPerDay * 365.

Annual EBITDA: Annual Gross Revenue - Annual OpEx.

Annual Net Cash Flow: EBITDA - Annual Loan Repayment.

Cumulative Cash Flow: Calculated year over year.

Terminal Value: scrapValue at the end of the analysis horizon.

Outputs (for results object):

npv (Net Present Value): The sum of all discounted future cash flows (including initial investment and terminal value).

irr (Internal Rate of Return): The discount rate at which NPV is zero.

paybackPeriod: The time it takes for the cumulative cash flow to turn positive.

cashFlows: An array of objects, one for each year of the analysis: { year, revenue, opex, debtPayment, netCashFlow }.

amortizationSchedule: An array showing the breakdown of principal and interest for each year.

keyRatios: A map with values like Debt Service Coverage Ratio (DSCR), etc.