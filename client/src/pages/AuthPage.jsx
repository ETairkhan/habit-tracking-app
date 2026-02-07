import React, { useState } from "react";
import PropTypes from "prop-types";
import { apiClient } from "../apiClient.js";

const AuthPage = ({ onAuthSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formValues, setFormValues] = useState({
    username: "",
    email: "",
    emailOrUsername: "",
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setFormErrors({});
    setServerError("");
  };

  const handleChange = (event) => {
    const fieldName = event.target.name;
    const fieldValue = event.target.value;

    setFormValues((previousValues) => ({
      ...previousValues,
      [fieldName]: fieldValue,
    }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (isLoginMode) {
      if (!formValues.emailOrUsername.trim()) {
        nextErrors.emailOrUsername = "Email or username is required";
      }
      if (!formValues.password) {
        nextErrors.password = "Password is required";
      }
    } else {
      if (!formValues.username.trim()) {
        nextErrors.username = "Username is required";
      }
      if (!formValues.email.trim()) {
        nextErrors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(formValues.email)) {
        nextErrors.email = "Email must be valid";
      }
      if (!formValues.password) {
        nextErrors.password = "Password is required";
      } else if (formValues.password.length < 6) {
        nextErrors.password = "Password must be at least 6 characters";
      }
      if (!formValues.confirmPassword) {
        nextErrors.confirmPassword = "Please confirm your password";
      } else if (formValues.confirmPassword !== formValues.password) {
        nextErrors.confirmPassword = "Passwords do not match";
      }
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");

    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLoginMode) {
        const response = await apiClient.post("/auth/login", {
          emailOrUsername: formValues.emailOrUsername.trim(),
          password: formValues.password,
        });
        onAuthSuccess(response.data);
      } else {
        const response = await apiClient.post("/auth/register", {
          username: formValues.username.trim(),
          email: formValues.email.trim(),
          password: formValues.password,
        });
        onAuthSuccess(response.data);
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        "Something went wrong. Please try again.";
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <div className="w-full max-w-4xl grid gap-8 md:grid-cols-2">
        {/* Left side - Info */}
        <section className="flex flex-col justify-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              HabitFlow
            </h1>
            <p className="mt-2 text-lg text-slate-400">
              Создавай лучшие привычки, отслеживай прогресс
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="text-2xl">🎯</div>
              <div>
                <h3 className="font-semibold text-white">Ясные цели</h3>
                <p className="text-sm text-slate-400">Определи свои привычки и следи за их выполнением</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-2xl">📊</div>
              <div>
                <h3 className="font-semibold text-white">Детальная статистика</h3>
                <p className="text-sm text-slate-400">Видь свой прогресс через графики и аналитику</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-2xl">🔥</div>
              <div>
                <h3 className="font-semibold text-white">Стрики и награды</h3>
                <p className="text-sm text-slate-400">Мотивируйся достижениями и непрерывными днями</p>
              </div>
            </div>
          </div>
        </section>

        {/* Right side - Form */}
        <section className="flex items-center justify-center">
          <div className="w-full rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">
                {isLoginMode ? "Вход в аккаунт" : "Создать аккаунт"}
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                {isLoginMode ? "Добро пожаловать! Введи свои данные" : "Присоединяйся к нам и начни отслеживать привычки"}
              </p>
            </div>

            {serverError && (
              <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 backdrop-blur px-4 py-3 text-sm text-red-200">
                ⚠️ {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isLoginMode ? (
                <>
                  <div>
                    <label
                      htmlFor="emailOrUsername"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Email или username
                    </label>
                    <input
                      id="emailOrUsername"
                      name="emailOrUsername"
                  type="text"
                  autoComplete="username"
                  value={formValues.emailOrUsername}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-0 ring-emerald-500/60 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2"
                  placeholder="you@example.com or username"
                  aria-invalid={Boolean(formErrors.emailOrUsername)}
                  aria-describedby={
                    formErrors.emailOrUsername ? "emailOrUsername-error" : undefined
                  }
                  required
                />
                {formErrors.emailOrUsername && (
                  <p
                    id="emailOrUsername-error"
                    className="mt-1 text-xs text-red-300"
                  >
                    {formErrors.emailOrUsername}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-slate-300"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={formValues.password}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-0 ring-emerald-500/60 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2"
                  placeholder="••••••••"
                  aria-invalid={Boolean(formErrors.password)}
                  aria-describedby={
                    formErrors.password ? "password-error" : undefined
                  }
                  required
                />
                {formErrors.password && (
                  <p id="password-error" className="mt-1 text-xs text-red-300">
                    {formErrors.password}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="username"
                    className="block text-xs font-medium text-slate-300"
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={formValues.username}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-0 ring-emerald-500/60 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2"
                    placeholder="yourname"
                    aria-invalid={Boolean(formErrors.username)}
                    aria-describedby={
                      formErrors.username ? "username-error" : undefined
                    }
                    required
                  />
                  {formErrors.username && (
                    <p id="username-error" className="mt-1 text-xs text-red-300">
                      {formErrors.username}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-medium text-slate-300"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formValues.email}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-0 ring-emerald-500/60 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2"
                    placeholder="you@example.com"
                    aria-invalid={Boolean(formErrors.email)}
                    aria-describedby={formErrors.email ? "email-error" : undefined}
                    required
                  />
                  {formErrors.email && (
                    <p id="email-error" className="mt-1 text-xs text-red-300">
                      {formErrors.email}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium text-slate-300"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={formValues.password}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-0 ring-emerald-500/60 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2"
                    placeholder="At least 6 characters"
                    aria-invalid={Boolean(formErrors.password)}
                    aria-describedby={
                      formErrors.password ? "password-error" : undefined
                    }
                    required
                  />
                  {formErrors.password && (
                    <p id="password-error" className="mt-1 text-xs text-red-300">
                      {formErrors.password}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-medium text-slate-300"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={formValues.confirmPassword}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-0 ring-emerald-500/60 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2"
                    placeholder="Re-enter password"
                    aria-invalid={Boolean(formErrors.confirmPassword)}
                    aria-describedby={
                      formErrors.confirmPassword ? "confirmPassword-error" : undefined
                    }
                    required
                  />
                  {formErrors.confirmPassword && (
                    <p
                      id="confirmPassword-error"
                      className="mt-1 text-xs text-red-300"
                    >
                      {formErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 font-semibold text-white shadow-lg transition hover:shadow-emerald-500/50 hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? isLoginMode
                ? "⏳ Вход..."
                : "✨ Создание аккаунта..."
              : isLoginMode
              ? "🔓 Вход"
              : "✨ Создать аккаунт"}
          </button>
            </form>

            <div className="border-t border-slate-700 mt-6 pt-6">
              <p className="text-center text-sm text-slate-400">
                {isLoginMode ? "Еще нет аккаунта? " : "Уже есть аккаунт? "}
                <button
                  type="button"
                  onClick={handleToggleMode}
                  className="font-semibold text-emerald-400 hover:text-emerald-300 transition"
                >
                  {isLoginMode ? "Зарегистрируйся" : "Войди"}
                </button>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

AuthPage.propTypes = {
  onAuthSuccess: PropTypes.func.isRequired,
};

export default AuthPage;


