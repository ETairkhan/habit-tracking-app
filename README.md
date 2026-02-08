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

#### Notifications (Email Reminders with SMTP, Private, JWT Required)

- `POST /api/notifications/test` — Send a test reminder email to current user
- `POST /api/notifications/weekly-preview` — Send weekly report email with list of user's habits

#### Admin Routes (Admin Role Required, JWT Required)

- `GET /api/admin/users` — Get all users (admin only)
- `GET /api/admin/users-with-habits` — Get all users with their habit counts and details (admin only)
- `POST /api/admin/make-admin` — Promote a user to admin role (admin only)
- `POST /api/admin/remove-admin` — Downgrade an admin user to regular user (admin only)
- `DELETE /api/admin/users/:userId` — Delete a user and all their associated data (admin only)
- `DELETE /api/admin/users/:userId/habits` — Delete all habits for a specific user (admin only)

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
- **Email Notifications** — Send habit reminders and weekly reports via SMTP
- **Admin Panel** — Admin users can view, manage users, and delete user data

### Email Reminders (SMTP Configuration)

HabitFlow supports sending email notifications to users using SMTP. Follow these steps to enable email features:

#### 1. Choose an Email Service Provider

Select a free email service:

- **Mailgun** (free tier): https://www.mailgun.com/
- **SendGrid** (free tier): https://sendgrid.com/
- **Postmark** (paid but reliable): https://postmarkapp.com/
- **Gmail SMTP** (Google Account): Use your Gmail address with app-specific password

#### 2. Get SMTP Credentials

Example for **Mailgun**:

- Create account at mailgun.com
- Go to Domain Settings > SMTP credentials
- Get: Username (e.g., postmaster@sandbox123.mailgun.org), Password, Host: smtp.mailgun.org

#### 3. Configure .env File

In `server/.env`, add these variables:

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@sandbox123.mailgun.org
SMTP_PASS=your-password-here
SMTP_FROM=noreply@habitflow.com
```

#### 4. Install Dependencies

Run in `server` directory:

```bash
npm install nodemailer
```

This is already in `package.json`, so just run:

```bash
npm install
```

#### 5. Test Email Functionality

Send a test email using the API:

```bash
curl -X POST http://localhost:5000/api/notifications/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

Response:

```json
{
  "message": "Test notification sent successfully",
  "email": "user@example.com"
}
```

#### 6. Send Weekly Report

Get a weekly habit report email:

```bash
curl -X POST http://localhost:5000/api/notifications/weekly-preview \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

Response:

```json
{
  "message": "Weekly report sent successfully",
  "habitCount": 5,
  "email": "user@example.com"
}
```

**Notes:**

- Emails are sent asynchronously
- Check spam folder if emails don't appear in inbox
- Free tiers have rate limits (Mailgun: 300/day, SendGrid: 100/day)
- Each environment (dev, staging, production) needs different SMTP credentials

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
