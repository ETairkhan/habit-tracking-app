## HabitFlow – Habit Tracking App

HabitFlow is a full-stack habit tracking app built with **Node.js + Express + MongoDB Atlas** on the backend and **React + Vite + TailwindCSS** on the frontend. It implements JWT authentication, role-based access (basic), validation, and a responsive UI to manage personal habits.

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
     - `MONGODB_URI=your-mongodb-atlas-uri`
     - `JWT_SECRET=your-secret-key`
     - `PORT=5000`
     - `CLIENT_ORIGIN=http://localhost:5173`
   - `npm run dev`
3. **Frontend setup**
   - `cd client`
   - `npm install`
   - Create `.env` in `client` with:
     - `VITE_API_URL=http://localhost:5000`
   - `npm run dev`
4. **Run both from root**
   - `npm run dev`

### API Overview (Minimal for Assignment)

- **Auth**
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- **Users (private, JWT)**
  - `GET /api/users/profile`
  - `PUT /api/users/profile`
- **Habits (second resource, private, JWT)**
  - `POST /api/habits`
  - `GET /api/habits`
  - `GET /api/habits/:id`
  - `PUT /api/habits/:id`
  - `DELETE /api/habits/:id`

The frontend includes pages for registration, login, viewing and managing habits, and a basic profile page, all styled with TailwindCSS and mobile-responsive layouts.


