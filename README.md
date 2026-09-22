# OIL Safety Insights

Create a new project with Supabase enabled.

PROJECT: OIL SIF Precursor Intelligence & Safety Analytics Platform

Build a complete, working full-stack web application called:

OIL SIF Precursor Intelligence

The application is a prototype for analyzing Oil India Limited (OIL) HSSE safety reports such as Unsafe Act (UA), Unsafe Condition (UC), Near Miss, and Incident reports.

The system should use NLP/LLM capabilities to analyze free-text safety reports and:

Classify each report as:

SIF Potential

Non-SIF Potential

Automatically map the report to the relevant IOGP Life-Saving Rule.

Extract precursor information:

Activity

Location/site

Hazard

Barrier failure

Potential consequence

Recommended preventive focus

Identify recurring precursor patterns across reports.

Provide an interactive dashboard showing:

SIF-potential density

Sites with recurring SIF precursors

Activities associated with SIF potential

Life-Saving Rule distribution

Recurring barrier failures

Trends over time

Allow an HSE user to inspect individual reports and see why the AI classified them in a particular way.

IMPORTANT:
This is a decision-support prototype. AI results must NOT be presented as an autonomous safety decision. Clearly label AI-generated classifications as "AI Assessment" and allow human HSE review/override.

1. TECHNOLOGY STACK

Use the following architecture.

Frontend

React

Vite

JavaScript

Tailwind CSS

React Router

Axios

Recharts

Lucide React icons

Backend

Python

FastAPI

Pydantic

Uvicorn

Python dotenv

Database

Use MongoDB.

Use:

PyMongo or Motor

MongoDB Atlas compatible configuration

AI / LLM

Create an LLM service abstraction.

The application should support an LLM API through environment variables.

Prefer an OpenAI-compatible API interface so the provider can be changed later.

Do NOT hardcode API keys.

Use:

LLM_API_KEY
LLM_MODEL
LLM_BASE_URL

from .env.

The LLM layer must be isolated inside:

backend/services/llm_service.py

so that the model provider can easily be changed.

2. PROJECT STRUCTURE

Create this structure:

oil-sif-intelligence/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── requirements.txt
│   │
│   ├── models/
│   │   ├── report.py
│   │   ├── analysis.py
│   │   └── user.py
│   │
│   ├── schemas/
│   │   ├── report_schema.py
│   │   ├── analysis_schema.py
│   │   └── dashboard_schema.py
│   │
│   ├── routes/
│   │   ├── reports.py
│   │   ├── analysis.py
│   │   ├── dashboard.py
│   │   └── health.py
│   │
│   ├── services/
│   │   ├── llm_service.py
│   │   ├── report_service.py
│   │   ├── analytics_service.py
│   │   └── precursor_service.py
│   │
│   ├── prompts/
│   │   └── sif_analysis_prompt.py
│   │
│   └── utils/
│       ├── csv_parser.py
│       └── validators.py
│
├── sample_data/
│   └── safety_reports.csv
│
├── .gitignore
└── README.md


Keep frontend and backend completely separated.

3. UI / UX DESIGN

The UI must NOT look like a generic AI-generated dashboard.

Avoid:

excessive gradients

glowing cards

unnecessary glassmorphism

huge rounded containers

excessive animations

futuristic AI graphics

unnecessary illustrations

excessive colors

The design should look like a professional enterprise HSE analytics application.

Use a clean BLUE theme.

Suggested visual direction:

White background

Navy/dark blue primary text

Professional blue accent

Light blue backgrounds for selected states

Neutral gray borders

Subtle shadows

Small border radius

Good whitespace

Clear typography

The application should feel suitable for:

Oil & Gas

HSE departments

Enterprise analytics

Operations teams

Do not make it look like a consumer startup.

4. APPLICATION LAYOUT

Create a persistent sidebar.

Sidebar:

OIL
Safety Intelligence

Dashboard

Safety Reports

AI Analysis

Precursor Patterns

Analytics

Settings


At the top:

OIL SIF PRECURSOR INTELLIGENCE

Search reports...                     HSE User


Use a clean desktop-first layout.

Make the application responsive.

5. DASHBOARD PAGE

Create a professional HSE dashboard.

Header:

Safety Intelligence Dashboard

Monitor serious injury and fatality precursors across sites and activities.


Top KPI cards:

Total Reports
12,450

SIF Potential
2,735

SIF Density
21.97%

Reports Reviewed
8,940


Do NOT use fake data once the backend is connected.

Initially provide seed/sample data so the UI works immediately.

6. DASHBOARD CHARTS

Create:

Chart 1 — SIF Potential Trend

Line chart:

Month → SIF Potential Reports


Allow filtering by date range.

Chart 2 — Life-Saving Rules

Bar chart:

Energy Isolation
Line of Fire
Confined Space
Hot Work
Working at Height


Do not assume these are the only rules.

Make the backend configurable so additional IOGP Life-Saving Rules can be added.

Chart 3 — Site SIF Density

Horizontal bar chart.

Example:

Site A       24.5%
Site B       21.3%
Site C       18.7%
Site D       12.2%


Calculate these values from the database.

Chart 4 — Recurring Barrier Failures

Example:

Missing Energy Isolation
Insufficient Gas Testing
Inadequate PPE
Failure to Establish Exclusion Zone
Permit-to-Work Failure


7. SAFETY REPORTS PAGE

Create a table.

Columns:

Report ID
Date
Site
Report Type
Activity
SIF Potential
Life-Saving Rule
Status


SIF status should use subtle badges:

SIF Potential
Non-SIF
Needs Review


Add:

Search

Site filter

Report type filter

Life-Saving Rule filter

SIF filter

Date filter

Clicking a report opens the report details page.

8. REPORT DETAILS PAGE

Display:

Original Report

Show the complete free-text report.

Report Metadata

Report ID
Date
Site
Department
Activity
Report Type


AI Assessment

Display:

SIF Potential
YES

Confidence
87%

Life-Saving Rule
Energy Isolation


Do not represent confidence as mathematically authoritative if the LLM does not provide calibrated probabilities.

Instead, label it:

"AI confidence estimate"

or use:

High / Medium / Low.

9. AI REASONING

Show:

Why was this classified as SIF Potential?

The report indicates that work was performed without
isolating the relevant energy source, creating potential
exposure to hazardous stored or active energy.


This explanation must be generated by the LLM but should be concise.

Do NOT expose chain-of-thought or hidden reasoning.

Only show a short evidence-based explanation referencing facts in the report.

10. PRECURSOR INFORMATION

Display:

Activity
Compressor Maintenance

Location
Site A

Hazard
Electrical Energy

Barrier Failure
Energy isolation was not completed

Potential Consequence
Potential serious injury/fatality from electrical exposure


Also show:

Recommended HSE Focus
Verify energy isolation and permit controls before maintenance.


Make clear that this is an AI-generated recommendation.

11. HUMAN REVIEW

Add:

AI Assessment

[ SIF Potential ]

Human Review

[ Confirm SIF ]
[ Mark Non-SIF ]
[ Needs Further Review ]


Store:

review_status
reviewed_by
reviewed_at
human_classification
review_comment


This is important because the application is intended for HSE decision support.

12. AI ANALYSIS PAGE

Create a page where users can paste a new safety report.

UI:

Analyze Safety Report

Paste report description:

[                                     ]
[                                     ]
[                                     ]

Site:
[ Site A ]

Activity:
[ Pipeline Maintenance ]

Report Type:
[ Near Miss ]

        Analyze Report


When clicking Analyze:

Frontend:

POST /api/analysis/analyze


Backend sends the report to the LLM.

Display:

SIF Potential: YES

Life-Saving Rule:
Energy Isolation

Activity:
Pipeline Maintenance

Hazard:
Stored / Electrical Energy

Barrier Failure:
Energy source was not isolated

Potential Consequence:
Serious injury or fatality

AI Explanation:
...

Recommended Focus:
...


Allow:

Save Report


to store the analysis in MongoDB.

13. LLM IMPLEMENTATION

Create:

backend/services/llm_service.py


Create a function:

analyze_safety_report(report_text, metadata)


The LLM MUST return structured JSON.

Use a schema similar to:

{
  "sif_potential": true,
  "sif_level": "High",
  "life_saving_rule": "Energy Isolation",
  "activity": "Compressor Maintenance",
  "location": "Site A",
  "hazard": "Electrical Energy",
  "barrier_failure": "Energy isolation not completed",
  "potential_consequence": "Potential serious injury or fatality",
  "evidence": [
    "Maintenance was being performed",
    "Electrical source was not isolated"
  ],
  "explanation": "The report indicates exposure to an uncontrolled energy source during maintenance.",
  "recommended_focus": "Verify energy isolation and permit controls before maintenance."
}


The backend MUST validate the returned JSON using Pydantic.

If the LLM returns invalid JSON:

Attempt structured parsing.

Retry once with a correction instruction.

If still invalid, return a controlled error.

Never crash the API.

14. IMPORTANT LLM PROMPT

Create:

backend/prompts/sif_analysis_prompt.py


The system prompt should explain:

You are an industrial HSE safety-report classification assistant.

Analyze the supplied safety report.

Determine whether the report contains credible indicators of serious injury or fatality potential.

Do not classify solely based on whether an injury actually occurred.

Consider:

hazardous energy

work at height

confined space

hot work

line-of-fire exposure

lifting operations

vehicle/mobile equipment interaction

pressure

hazardous substances

electrical exposure

isolation failures

permit failures

missing or ineffective barriers

Map the report to the most relevant configured IOGP Life-Saving Rule.

Extract:

activity

location

hazard

barrier failure

potential consequence

Only use information supported by the report.

If information is missing, return "Unknown".

Do not invent facts.

Provide a concise evidence-based explanation.

Do not provide hidden chain-of-thought.

Return only the requested structured JSON.

15. LIFE-SAVING RULE CONFIGURATION

Create a configurable list.

At minimum include the rules required by the project:

Energy Isolation
Hot Work
Confined Space
Line of Fire


Also allow additional rules to be added later.

Do NOT hard-code the rules throughout the frontend.

Create one configuration source in the backend.

The frontend should retrieve available rules through:

GET /api/analysis/life-saving-rules


16. PRECURSOR PATTERN DETECTION

Create:

backend/services/precursor_service.py


The system should identify recurring combinations such as:

Site + Activity + Barrier Failure

Site A
+
Pipeline Maintenance
+
Energy Isolation Failure


Calculate frequency.

Example:

Pattern
Pipeline Maintenance → Energy Isolation Failure

Occurrences
43

SIF Potential
38

Percentage
88.4%


Other useful dimensions:

site

activity

life-saving rule

hazard

barrier failure

report type

Do NOT call something a statistically significant trend unless an actual statistical test is performed.

Use terms such as:

recurring pattern

frequently observed

high occurrence

17. ANALYTICS PAGE

Create filters:

Date Range
Site
Activity
Report Type
Life-Saving Rule
SIF Classification


Show:

Site Analysis

Site
Total Reports
SIF Reports
SIF Density


Activity Analysis

Activity
Total Reports
SIF Reports
SIF Density


Life-Saving Rule Analysis

Rule
Reports
SIF Reports
Percentage


Barrier Failure Analysis

Barrier Failure
Occurrences
Associated SIF Reports


All analytics must come from backend APIs.

18. BACKEND API

Implement the following APIs.

Health

GET /api/health


Returns:

{
  "status": "ok"
}


Reports

GET /api/reports
GET /api/reports/{report_id}
POST /api/reports
PUT /api/reports/{report_id}
DELETE /api/reports/{report_id}


Support query parameters:

site
sif_potential
life_saving_rule
report_type
activity
search
page
limit


Upload

Create:

POST /api/reports/upload


Accept:

CSV


Validate the uploaded file.

Do not blindly trust uploaded columns.

Return:

rows processed
rows accepted
rows rejected
errors


19. ANALYSIS APIs

POST /api/analysis/analyze

GET /api/analysis/{report_id}

POST /api/analysis/{report_id}/reanalyze


20. HUMAN REVIEW API

POST /api/reports/{report_id}/review


Request:

{
  "classification": "SIF",
  "comment": "Confirmed after HSE review"
}


Store review metadata.

21. DASHBOARD API

Create:

GET /api/dashboard/summary
GET /api/dashboard/trends
GET /api/dashboard/sites
GET /api/dashboard/activities
GET /api/dashboard/life-saving-rules
GET /api/dashboard/barriers
GET /api/dashboard/patterns


The frontend should never calculate major business analytics itself.

The backend should provide aggregated results.

22. DATABASE

Create MongoDB collections:

reports
analyses
reviews


A report document should contain fields such as:

_id
report_id
date
site
department
report_type
activity
description
created_at
updated_at


Analysis:

report_id
sif_potential
sif_level
life_saving_rule
activity
location
hazard
barrier_failure
potential_consequence
evidence
explanation
recommended_focus
model
created_at


Review:

report_id
classification
reviewed_by
reviewed_at
comment


23. SAMPLE DATA

Create at least 30 realistic synthetic safety reports for demonstration.

IMPORTANT:

Do not claim these are real OIL records.

Clearly label the dataset:

"Synthetic demonstration data — not actual OIL operational data."

Include examples involving:

Energy Isolation

Hot Work

Confined Space

Line of Fire

Work at Height

Lifting

Vehicle interaction

Electrical exposure

Permit-to-work failures

housekeeping

PPE observations

minor non-SIF observations

Create enough variation across:

Site A
Site B
Site C
Site D


and different activities.

Some reports should be ambiguous so that the UI can demonstrate "Needs Review".

24. SEED DATA API

Create:

POST /api/reports/seed


This should populate the database with synthetic demonstration data.

Do not run automatically every time the backend starts.

25. ERROR HANDLING

Backend:

Use proper HTTP status codes.

Validate all incoming data.

Return useful JSON errors.

Never expose API keys.

Handle LLM failures gracefully.

Handle MongoDB connection failures.

Handle malformed CSV files.

Handle missing fields.

Frontend:

Show loading states.

Show empty states.

Show error messages.

Prevent duplicate submissions.

Show success notifications.

26. SECURITY

Create .env.example.

Example:

MONGODB_URI=
LLM_API_KEY=
LLM_MODEL=
LLM_BASE_URL=
PORT=8000


Never commit .env.

Add to .gitignore:

.env
.venv
node_modules
__pycache__


Never put the LLM API key in React frontend code.

All LLM calls must happen from FastAPI.

27. FRONTEND API SERVICE

Create:

frontend/src/services/api.js


Configure Axios with:

VITE_API_URL


Example:

VITE_API_URL=http://localhost:8000


All backend communication must go through this service.

Do not scatter hardcoded API URLs throughout components.

28. LOADING / EMPTY STATES

Every major page must have:

Loading state:

Loading safety data...


Empty state:

No reports found.


Error state:

Unable to load safety data.
Try again.


29. RESPONSIVE DESIGN

The primary target is desktop because HSE dashboards will likely be used on larger screens.

Still support:

laptop

tablet

mobile

Do not allow charts/tables to overflow the page.

30. ACCESSIBILITY

Use:

semantic HTML

proper button labels

sufficient contrast

keyboard-accessible controls

meaningful icons

tooltips where icons alone are used

Do not use color alone to communicate SIF status.

31. README

Create a detailed README containing:

Project Overview

Architecture

Tech Stack

Folder Structure

Environment Variables

Backend Setup

cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload


Frontend Setup

cd frontend
npm install
npm run dev


MongoDB Setup

Explain how to configure MongoDB Atlas.

LLM Setup

Explain how to add the API key.

API Documentation

Mention FastAPI Swagger documentation:

/api/docs


Sample Data

Explain how to seed synthetic data.

Important Data Disclaimer

State clearly that synthetic demo data must not be represented as actual OIL operational data.

32. DEVELOPMENT APPROACH

Do NOT generate a fake frontend with disconnected mock functionality.

Build the application in these stages:

PHASE 1:
Create the React UI using synthetic data.

PHASE 2:
Create FastAPI backend.

PHASE 3:
Connect MongoDB.

PHASE 4:
Connect frontend to backend.

PHASE 5:
Implement LLM analysis.

PHASE 6:
Implement report upload.

PHASE 7:
Implement analytics.

PHASE 8:
Implement human review.

PHASE 9:
Test complete end-to-end workflow.

At the end, every major button must perform a real action.

33. END-TO-END DEMO

The final application must support this workflow:

User uploads CSV
        ↓
FastAPI validates CSV
        ↓
Reports stored in MongoDB
        ↓
User selects report
        ↓
Click "Analyze with AI"
        ↓
FastAPI sends report to LLM
        ↓
LLM returns structured analysis
        ↓
Backend validates response
        ↓
Analysis stored in MongoDB
        ↓
Dashboard statistics update
        ↓
Recurring precursor patterns update


Also support:

Paste new report
        ↓
Analyze
        ↓
View AI Assessment
        ↓
Save
        ↓
Human HSE Review
        ↓
Dashboard reflects reviewed classification


34. IMPORTANT UI DETAIL

The application should NOT constantly display the word "AI".

Use AI only where it adds value.

For example:

Good:

SIF Assessment
AI-generated assessment

Life-Saving Rule
Energy Isolation

Evidence
...


Avoid:

🤖 SUPER AI INTELLIGENCE ENGINE
✨ NEXT-GEN AI POWERED ANALYTICS ✨


The application should feel like a professional safety analytics tool that happens to use AI.

35. FINAL QUALITY REQUIREMENT

Before considering the project complete, test:

Backend starts successfully.

MongoDB connects successfully.

Frontend starts successfully.

Dashboard loads.

Synthetic reports can be seeded.

Reports appear in the table.

Search works.

Filters work.

Individual report opens.

LLM analysis works.

AI results are saved.

Human review works.

Dashboard statistics update.

Charts display real backend data.

CSV upload works.

Invalid CSV is handled.

LLM failure is handled.

No API key is exposed to frontend.

.env is ignored by Git.

README contains complete setup instructions.

Do not stop after generating files.

Run the application, identify errors, fix them, and verify the complete workflow.

The final result must be a genuinely connected full-stack prototype rather than a static UI.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/376393c0-f070-4383-a09d-b2e8e955318a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
