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
    <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
      <section className="md:max-w-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Build better habits with HabitFlow
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Track your daily routines, visualize your streaks, and stay
          accountable. Create an account or log in to get started.
        </p>
      </section>

      <section className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/40">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">
            {isLoginMode ? "Log in to HabitFlow" : "Create your HabitFlow account"}
          </h2>
          <button
            type="button"
            onClick={handleToggleMode}
            className="text-xs text-emerald-400 hover:underline"
          >
            {isLoginMode ? "Need an account? Register" : "Already have an account? Log in"}
          </button>
        </div>

        {serverError && (
          <div className="mb-3 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {isLoginMode ? (
            <>
              <div>
                <label
                  htmlFor="emailOrUsername"
                  className="block text-xs font-medium text-slate-300"
                >
                  Email or Username
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
            className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting
              ? isLoginMode
                ? "Logging in..."
                : "Creating account..."
              : isLoginMode
              ? "Log in"
              : "Sign up"}
          </button>
        </form>
      </section>
    </div>
  );
};

AuthPage.propTypes = {
  onAuthSuccess: PropTypes.func.isRequired,
};

export default AuthPage;


