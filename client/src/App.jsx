import React, { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { apiClient } from "./apiClient.js";
import AuthPage from "./pages/AuthPage.jsx";
import HabitsPage from "./pages/HabitsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import StatsPage from "./pages/StatsPage.jsx";
import DaysPage from "./pages/DaysPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";

const AppLayout = ({ children, onLogout, currentUser }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link
            to="/"
            className="flex items-center gap-3 text-lg font-bold tracking-tight transition hover:opacity-80"
          >
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-white shadow-lg"
              aria-label="HabitFlow logo"
            >
              HF
            </span>
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">HabitFlow</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {currentUser && (
              <>
                <Link
                  to="/habits"
                  className="rounded-lg px-4 py-2.5 text-slate-300 font-medium transition hover:bg-slate-800 hover:text-emerald-400"
                >
                  🎯 Привычки
                </Link>
                <Link
                  to="/days"
                  className="rounded-lg px-4 py-2.5 text-slate-300 font-medium transition hover:bg-slate-800 hover:text-blue-400"
                >
                  📅 Дни
                </Link>
                <Link
                  to="/stats"
                  className="rounded-lg px-4 py-2.5 text-slate-300 font-medium transition hover:bg-slate-800 hover:text-purple-400"
                >
                  📊 Статистика
                </Link>
                <Link
                  to="/profile"
                  className="rounded-lg px-4 py-2.5 text-slate-300 font-medium transition hover:bg-slate-800 hover:text-cyan-400"
                >
                  👤 Профиль
                </Link>
                <Link
                  to="/notifications"
                  className="rounded-lg px-4 py-2.5 text-slate-300 font-medium transition hover:bg-slate-800 hover:text-emerald-400"
                >
                  📧 Уведомления
                </Link>
                {(currentUser?.role === "admin" ||
                  currentUser?.role === "moderator") && (
                  <Link
                    to="/admin"
                    className="rounded-lg px-4 py-2.5 text-slate-300 font-medium transition hover:bg-slate-800 hover:text-amber-400"
                  >
                    ⚙️ Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={onLogout}
                  className="ml-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-emerald-500/50 hover:from-emerald-400 hover:to-emerald-500"
                >
                  Выход
                </button>
              </>
            )}
          </nav>

          {/* Mobile Burger Menu Button */}
          {currentUser && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 transition text-emerald-400"
              aria-label="Toggle menu"
            >
              <span className="flex flex-col gap-1.5 w-5 h-5">
                <span className={`block h-0.5 w-5 bg-emerald-400 transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`block h-0.5 w-5 bg-emerald-400 transition-all ${menuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block h-0.5 w-5 bg-emerald-400 transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </span>
            </button>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        {currentUser && menuOpen && (
          <nav className="md:hidden bg-slate-800/95 border-t border-slate-700 px-4 py-3">
            <div className="flex flex-col gap-2">
              <Link
                to="/habits"
                className="block rounded-lg px-4 py-3 text-slate-300 font-medium transition hover:bg-slate-700 hover:text-emerald-400"
                onClick={() => setMenuOpen(false)}
              >
                🎯 Привычки
              </Link>
              <Link
                to="/days"
                className="block rounded-lg px-4 py-3 text-slate-300 font-medium transition hover:bg-slate-700 hover:text-blue-400"
                onClick={() => setMenuOpen(false)}
              >
                📅 Дни
              </Link>
              <Link
                to="/stats"
                className="block rounded-lg px-4 py-3 text-slate-300 font-medium transition hover:bg-slate-700 hover:text-purple-400"
                onClick={() => setMenuOpen(false)}
              >
                📊 Статистика
              </Link>
              <Link
                to="/profile"
                className="block rounded-lg px-4 py-3 text-slate-300 font-medium transition hover:bg-slate-700 hover:text-cyan-400"
                onClick={() => setMenuOpen(false)}
              >
                👤 Профиль
              </Link>
              <Link
                to="/notifications"
                className="block rounded-lg px-4 py-3 text-slate-300 font-medium transition hover:bg-slate-700 hover:text-emerald-400"
                onClick={() => setMenuOpen(false)}
              >
                📧 Уведомления
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="w-full mt-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-emerald-500/50 hover:from-emerald-400 hover:to-emerald-500"
              >
                Выход
              </button>
            </div>
          </nav>
        )}
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
      </main>
      <footer className="border-t border-slate-800 bg-slate-900/50 py-6 text-center text-xs text-slate-500">
        <p>HabitFlow © 2025 • Приложение для отслеживания привычек</p>
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
          element={
            currentUser ? (
              <Navigate to="/habits" replace />
            ) : (
              <AuthPage onAuthSuccess={handleAuthSuccess} />
            )
          }
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
          path="/days"
          element={
            currentUser ? (
              <DaysPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/stats"
          element={
            currentUser ? (
              <StatsPage />
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
        <Route
          path="/notifications"
          element={
            currentUser ? (
              <NotificationsPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/admin"
          element={
            currentUser &&
            (currentUser.role === "admin" || currentUser.role === "moderator") ? (
              <AdminPage currentUser={currentUser} />
            ) : currentUser ? (
              <Navigate to="/habits" replace />
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
