## HabitFlow – Habit Tracking App

HabitFlow is a full-stack habit tracking app built with **Node.js + Express + MongoDB Atlas** on the backend and **React + Vite + TailwindCSS** on the frontend. It implements JWT authentication, role-based access (basic), validation, and a responsive UI to manage personal habits.

**Database**: Uses **MongoDB Atlas** — a managed cloud database that supports multi-user collaboration and remote access.

### Folder Structure

- **`server`**: Node.js / Express API  
- **`client`**: React + Vite frontend  
- Root `package.json` lets you run both from the project root.

### Setup Instructions

1. **Clone & install root tools**
   - `npm install`
2. **Backend setup**
   - `cd server`
   - `npm install`
   - Create `.env` in `server` with:
     - `MONGODB_URI=your-mongodb-atlas-uri` (copy from MongoDB Atlas Project > Connect > Connect your application)
     - `JWT_SECRET=your-secret-key`
     - `PORT=5000`
     - `CLIENT_ORIGIN=http://localhost:5173`
   - `npm run dev` or `npm start`
3. **Frontend setup**
   - `cd client`
   - `npm install`
   - Create `.env` in `client` with:
     - `VITE_API_URL=http://localhost:5000`
   - `npm run dev`
4. **Run both from root**
   - `npm run dev`

### API Overview

#### Authentication
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login & receive JWT token

#### Users (Private, JWT Required)
- `GET /api/users/profile` — Get current user profile
- `PUT /api/users/profile` — Update profile (email, username, displayName)
- `GET /api/users/stats` — Get aggregated statistics (habits by category, by frequency, top category, overall success rate)

#### Habits (Private, JWT Required)
- `POST /api/habits` — Create new habit
- `GET /api/habits` — List all user's habits
- `GET /api/habits/:id` — Get habit details
- `PUT /api/habits/:id` — Update habit
- `DELETE /api/habits/:id` — Delete habit

#### Habit Checkins (Daily Tracking, Private, JWT Required)
- `POST /api/habits/:habitId/checkins` — Mark habit as completed for a specific date
- `GET /api/habits/:habitId/checkins/stats` — Get habit statistics (current streak, longest streak, success rate, last 30 days breakdown)
- `GET /api/habits/:habitId/checkins` — Get checkins for date range
- `PUT /api/habits/:habitId/checkins/:checkinId` — Update a checkin
- `DELETE /api/habits/:habitId/checkins/:checkinId` — Delete a checkin

### Database Models

- **User** — username, email, password, displayName, role, settings, stats
- **Habit** — name, description, category, frequency, user reference, statistics (currentStreak, longestStreak, successRate)
- **Checkin** — user, habit, date, completed flag, notes (for daily tracking)

### Features

- **Habit Management** — Create, update, delete habits with categories (health, productivity, learning, mindfulness, social, other) and frequencies (daily, weekly, custom)
- **Daily Tracking** — Mark habits as completed/incomplete for each day
- **Statistics** — Track streaks, success rates, and view statistics by category and frequency
- **Multi-User Support** — Team of 4+ can share same MongoDB Atlas cluster; each user manages their own habits
- **Authentication** — JWT-based secure access
- **Responsive UI** — Mobile-friendly design with TailwindCSS

### Key Stats Endpoints

**GET /api/users/stats** returns:
```json
{
  "totalHabits": 5,
  "totalCheckins": 25,
  "totalCompletedCheckins": 20,
  "overallSuccessRate": 80,
  "habitsByCategory": [
    { "category": "health", "count": 2, "habits": [...] },
    { "category": "productivity", "count": 2, "habits": [...] }
  ],
  "habitsByFrequency": [
    { "frequency": "daily", "count": 4 },
    { "frequency": "weekly", "count": 1 }
  ],
  "topCategory": { "category": "health", "count": 2 },
  "avgHabitsPerCategory": 1.7,
  "topHabits": [...]
}
```

The frontend includes pages for registration, login, viewing and managing habits, daily checkins, statistics dashboard, and a basic profile page, all styled with TailwindCSS and mobile-responsive layouts.


