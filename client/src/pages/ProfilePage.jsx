import React, { useState } from "react";
import PropTypes from "prop-types";
import { apiClient } from "../apiClient.js";

const ProfilePage = ({ currentUser, setCurrentUser }) => {
  const [formValues, setFormValues] = useState({
    username: currentUser.username || "",
    email: currentUser.email || "",
    displayName: currentUser.displayName || "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [serverSuccess, setServerSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (!formValues.username.trim()) {
      nextErrors.username = "Username is required";
    }

    if (!formValues.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formValues.email)) {
      nextErrors.email = "Email must be valid";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");
    setServerSuccess("");

    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.put("/users/profile", {
        username: formValues.username.trim(),
        email: formValues.email.trim(),
        displayName: formValues.displayName.trim(),
      });

      setCurrentUser(response.data);
      setServerSuccess("Profile updated successfully.");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        "Failed to update profile. Please try again.";
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Profile
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Update your account information. Changes are effective for your next
          sessions.
        </p>
      </header>

      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        {serverError && (
          <div className="mb-3 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {serverError}
          </div>
        )}
        {serverSuccess && (
          <div className="mb-3 rounded-md border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            {serverSuccess}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div>
            <label
              htmlFor="profile-username"
              className="block text-xs font-medium text-slate-300"
            >
              Username
            </label>
            <input
              id="profile-username"
              name="username"
              type="text"
              value={formValues.username}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-0 ring-emerald-500/60 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2"
              aria-invalid={Boolean(formErrors.username)}
              aria-describedby={
                formErrors.username ? "profile-username-error" : undefined
              }
              required
            />
            {formErrors.username && (
              <p
                id="profile-username-error"
                className="mt-1 text-xs text-red-300"
              >
                {formErrors.username}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="profile-email"
              className="block text-xs font-medium text-slate-300"
            >
              Email
            </label>
            <input
              id="profile-email"
              name="email"
              type="email"
              value={formValues.email}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-0 ring-emerald-500/60 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2"
              aria-invalid={Boolean(formErrors.email)}
              aria-describedby={
                formErrors.email ? "profile-email-error" : undefined
              }
              required
            />
            {formErrors.email && (
              <p id="profile-email-error" className="mt-1 text-xs text-red-300">
                {formErrors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="profile-displayName"
              className="block text-xs font-medium text-slate-300"
            >
              Display name
            </label>
            <input
              id="profile-displayName"
              name="displayName"
              type="text"
              value={formValues.displayName}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-0 ring-emerald-500/60 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2"
              placeholder="Name shown in the app"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Saving changes..." : "Save profile"}
          </button>
        </form>
      </section>
    </div>
  );
};

ProfilePage.propTypes = {
  currentUser: PropTypes.shape({
    username: PropTypes.string,
    email: PropTypes.string,
    displayName: PropTypes.string,
  }).isRequired,
  setCurrentUser: PropTypes.func.isRequired,
};

export default ProfilePage;


