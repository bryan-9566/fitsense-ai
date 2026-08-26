# FitSense AI

**AI-Powered Personalized Fitness & Performance Platform**

FitSense AI is a full-stack fitness application that combines workout tracking,
goal management, fitness analytics, Gemini-powered coaching, personalized
workout generation, and adaptive performance recommendations.

---

## Features

### Authentication

- User registration and login
- JWT authentication
- bcrypt password hashing
- Protected API routes
- USER / ADMIN roles

### Workout Tracking

- Create workouts
- Edit workouts
- Delete workouts
- Strength, cardio, flexibility, sport, and other categories
- Duration, calories, sets, reps, weight, and intensity tracking
- Pagination
- Category filtering

### Goals

- Create fitness goals
- Update progress
- Pause and complete goals
- Delete goals
- Progress visualization

### Profile

- Age
- Height
- Current weight
- Target weight
- Fitness goal
- Experience level
- Available equipment

### Analytics

FitSense calculates:

- 7-day workout count
- 30-day workout count
- Average workout duration
- Calories burned
- Training volume
- 30-day consistency percentage
- Current workout streak
- Active goals
- Completed goals
- Goal completion percentage

### Gemini AI

#### AI Coach

Uses the user's stored profile, goals, and tracked activity to answer
fitness-planning questions with context-aware guidance.

#### AI Workout Generator

Generates personalized workout plans using:

- Fitness goal
- Experience level
- Available equipment
- Recent activity

Generated plans are saved as workout plans for later use.

#### AI Progress Analyzer

Analyzes tracked metrics and provides:

- Strengths
- Areas needing attention
- Supported trends
- Practical next steps

#### Adaptive Performance Engine

Compares planned and actual exercise performance and returns:

- `PROGRESS`
- `MAINTAIN`
- `REGRESS`
- `RECOVER`

---

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- Context API
- Recharts
- React Markdown

### Backend

- Node.js
- Express.js
- REST API architecture

### Database

- MongoDB
- Mongoose

### Security

- JWT
- bcrypt
- Protected routes
- Ownership checks
- Role-based authorization

### AI

- Google Gemini API
- `@google/genai`

### Testing

- Jest
- Supertest

---

## Architecture

```text
                         FitSense AI

                    React + Vite Frontend
                              |
                         Axios / REST
                              |
                     Node.js + Express
                              |
             +----------------+----------------+
             |                |                |
          MongoDB          Analytics        Gemini AI
             |                |                |
         Mongoose       Fitness Metrics    AI Coach
             |                              AI Plans
             |                              AI Analysis
             |                                   |
             +----------------+------------------+
                              |
                     Adaptive Engine
                              |
                  Next-session Recommendation
```

---

## Application Flow

```text
Register / Login
       |
       v
Profile Setup
       |
       v
Create Goals
       |
       v
Track Workouts
       |
       v
Analytics
       |
       +----------> AI Coach
       |
       +----------> AI Workout Generator
       |
       +----------> AI Progress Analysis
       |
       v
Saved Workout Plan
       |
       v
Adaptive Training
       |
       v
Record Actual Performance
       |
       v
Adaptive Recommendation
```

---

## Project Structure

```text
FITSENSE -AI/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── config/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── tests/
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── styles.css
│   │
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
```

---

## Local Setup

### Prerequisites

- Node.js
- MongoDB running locally
- A Google Gemini API key

### Backend

```powershell
cd backend
npm install
```

Create:

```text
backend/.env
```

based on `backend/.env.example`.

Example:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/fitsense_ai
JWT_SECRET=your_local_jwt_secret

CORS_ORIGIN=http://localhost:5173

AI_MODE=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash-lite
```

Start the backend:

```powershell
npm run dev
```

Backend:

```text
http://localhost:5000
```

Health endpoint:

```text
http://localhost:5000/api/health
```

### Frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally:

```text
http://localhost:5173
```

---

## API Overview

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

### Users

```text
GET /api/users/me
PUT /api/users/me/profile
```

### Workouts

```text
POST   /api/workouts
GET    /api/workouts
PUT    /api/workouts/:id
DELETE /api/workouts/:id
```

### Goals

```text
POST   /api/goals
GET    /api/goals
PUT    /api/goals/:id
DELETE /api/goals/:id
```

### Analytics

```text
GET /api/analytics/summary
```

### AI

```text
POST /api/ai/coach
POST /api/ai/workout-plan
POST /api/ai/progress
POST /api/ai/adaptive
```

### Saved Workout Plans

```text
GET /api/workout-plans
GET /api/workout-plans/:id
```

### Health

```text
GET /api/health
```

---

## Testing

Run:

```powershell
cd backend
npm test
```

Current automated coverage:

```text
Authentication      6 tests
Workouts           10 tests
Goals              10 tests
Analytics           6 tests
AI / Adaptive       5 tests
Health              1 test
--------------------------------
Total              38 tests
```

Expected:

```text
Test Suites: 6 passed, 6 total
Tests:       38 passed, 38 total
```

---

## Security Notes

- Never commit `.env`.
- Store Gemini API credentials in environment variables.
- Passwords are hashed with bcrypt.
- JWT protects authenticated endpoints.
- Users can only access their own workouts and goals.
- Keep API credentials out of source control.

---

## Disclaimer

FitSense AI provides general fitness-planning assistance based on tracked
application data. It is not a medical diagnostic or treatment system.
