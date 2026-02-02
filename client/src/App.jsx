import React, { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { apiClient } from "./apiClient.js";
import AuthPage from "./pages/AuthPage.jsx";
import HabitsPage from "./pages/HabitsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";

const AppLayout = ({ children, onLogout, currentUser }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-slate-950"
              aria-label="HabitFlow logo"
            >
              HF
            </span>
            <span>HabitFlow</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            {currentUser && (
              <>
                <Link
                  to="/habits"
                  className="rounded-md px-3 py-1.5 text-slate-200 transition hover:bg-slate-800 hover:text-white"
                >
                  Habits
                </Link>
                <Link
                  to="/profile"
                  className="rounded-md px-3 py-1.5 text-slate-200 transition hover:bg-slate-800 hover:text-white"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-slate-950 shadow-sm transition hover:bg-emerald-400"
                >
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
      </main>
      <footer className="border-t border-slate-800 bg-slate-900/80 py-3 text-center text-xs text-slate-500">
        HabitFlow • Habit tracking app demo
      </footer>
    </div>
  );
};

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleFetchProfile = async () => {
      const token = localStorage.getItem("habitflow_token");
      if (!token) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const response = await apiClient.get("/users/profile");
        setCurrentUser(response.data);
      } catch {
        localStorage.removeItem("habitflow_token");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    handleFetchProfile();
  }, []);

  const handleAuthSuccess = (data) => {
    localStorage.setItem("habitflow_token", data.token);
    setCurrentUser(data.user);
    navigate("/habits");
  };

  const handleLogout = () => {
    localStorage.removeItem("habitflow_token");
    setCurrentUser(null);
    navigate("/");
  };

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-sm text-slate-400">Loading your session...</p>
      </div>
    );
  }

  return (
    <AppLayout onLogout={handleLogout} currentUser={currentUser}>
      <Routes>
        <Route
          path="/"
          element={<AuthPage onAuthSuccess={handleAuthSuccess} />}
        />
        <Route
          path="/habits"
          element={
            currentUser ? (
              <HabitsPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={
            currentUser ? (
              <ProfilePage currentUser={currentUser} setCurrentUser={setCurrentUser} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
};

export default App;


