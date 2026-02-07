import React, { useEffect, useState } from "react";
import { apiClient } from "../apiClient.js";

const emptyHabitForm = {
  name: "",
  description: "",
  category: "other",
  frequency: "daily",
};

const HabitsPage = () => {
  const [habits, setHabits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serverError, setServerError] = useState("");
  const [habitForm, setHabitForm] = useState(emptyHabitForm);
  const [habitFormErrors, setHabitFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState(null);
  const [statsModal, setStatsModal] = useState({ open: false, data: null });
  const [checkinDate, setCheckinDate] = useState(() => new Date().toISOString().split("T")[0]);

  const handleFetchHabits = async () => {
    setIsLoading(true);
    setServerError("");
    try {
      const response = await apiClient.get("/habits");
      setHabits(response.data);
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to load habits. Please retry.";
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleFetchHabits();
  }, []);

  const handleHabitFormChange = (event) => {
    const fieldName = event.target.name;
    const fieldValue = event.target.value;
    setHabitForm((previousState) => ({
      ...previousState,
      [fieldName]: fieldValue,
    }));
  };

  const handleStartCreateHabit = () => {
    setEditingHabitId(null);
    setHabitForm(emptyHabitForm);
    setHabitFormErrors({});
  };

  const handleStartEditHabit = (habit) => {
    setEditingHabitId(habit._id);
    setHabitForm({
      name: habit.name || "",
      description: habit.description || "",
      category: habit.category || "other",
      frequency: habit.frequency || "daily",
    });
    setHabitFormErrors({});
  };

  const validateHabitForm = () => {
    const nextErrors = {};
    if (!habitForm.name.trim()) {
      nextErrors.name = "Habit name is required";
    }
    setHabitFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmitHabit = async (event) => {
    event.preventDefault();
    setServerError("");

    const isValid = validateHabitForm();
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: habitForm.name.trim(),
        description: habitForm.description.trim(),
        category: habitForm.category,
        frequency: habitForm.frequency,
      };

      if (editingHabitId) {
        await apiClient.put(`/habits/${editingHabitId}`, payload);
      } else {
        await apiClient.post("/habits", payload);
      }

      await handleFetchHabits();
      setHabitForm(emptyHabitForm);
      setEditingHabitId(null);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        "Failed to save habit. Please try again.";
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHabit = async (habitId) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this habit?"
    );
    if (!isConfirmed) {
      return;
    }

    try {
      await apiClient.delete(`/habits/${habitId}`);
      setHabits((previousHabits) =>
        previousHabits.filter((habitItem) => habitItem._id !== habitId)
      );
      if (editingHabitId === habitId) {
        setEditingHabitId(null);
        setHabitForm(emptyHabitForm);
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to delete habit. Please retry.";
      setServerError(message);
    }
  };

  const handleCheckin = async (habitId, date = checkinDate) => {
    setServerError("");
    try {
      await apiClient.post(`/habits/${habitId}/checkins`, { date, completed: true });
      await handleFetchHabits();
    } catch (error) {
      const message = error.response?.data?.message || "Failed to create checkin.";
      setServerError(message);
    }
  };

  const openStats = async (habit) => {
    setServerError("");
    try {
      const res = await apiClient.get(`/habits/${habit._id}/checkins/stats`);
      setStatsModal({ open: true, data: res.data });
    } catch (error) {
      const message = error.response?.data?.message || "Failed to load stats.";
      setServerError(message);
    }
  };

  const closeStats = () => setStatsModal({ open: false, data: null });

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Your Habits
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Create and track the routines you want to build. Edit or remove them
            as your goals change.
          </p>
        </div>
        <button
          type="button"
          onClick={handleStartCreateHabit}
          className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-400"
        >
          Add new habit
        </button>
      </header>

      {serverError && (
        <div className="rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {serverError}
        </div>
      )}

      <section className="grid gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <form
          onSubmit={handleSubmitHabit}
          className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
        >
          <h2 className="mb-3 text-sm font-medium text-white">
            {editingHabitId ? "Edit habit" : "Create a new habit"}
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <label
                htmlFor="habit-name"
                className="block text-xs font-medium text-slate-300"
              >
                Habit name
              </label>
              <input
                id="habit-name"
                name="name"
                type="text"
                value={habitForm.name}
                onChange={handleHabitFormChange}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-0 ring-emerald-500/60 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2"
                placeholder="Drink 8 glasses of water"
                aria-invalid={Boolean(habitFormErrors.name)}
                aria-describedby={habitFormErrors.name ? "habit-name-error" : undefined}
                required
              />
              {habitFormErrors.name && (
                <p id="habit-name-error" className="mt-1 text-xs text-red-300">
                  {habitFormErrors.name}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="habit-description"
                className="block text-xs font-medium text-slate-300"
              >
                Description (optional)
              </label>
              <textarea
                id="habit-description"
                name="description"
                value={habitForm.description}
                onChange={handleHabitFormChange}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-0 ring-emerald-500/60 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2"
                rows={3}
                placeholder="Why does this habit matter to you?"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label
                  htmlFor="habit-category"
                  className="block text-xs font-medium text-slate-300"
                >
                  Category
                </label>
                <select
                  id="habit-category"
                  name="category"
                  value={habitForm.category}
                  onChange={handleHabitFormChange}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-0 ring-emerald-500/60 focus:border-emerald-500 focus:ring-2"
                >
                  <option value="health">Health</option>
                  <option value="productivity">Productivity</option>
                  <option value="learning">Learning</option>
                  <option value="mindfulness">Mindfulness</option>
                  <option value="social">Social</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="habit-frequency"
                  className="block text-xs font-medium text-slate-300"
                >
                  Frequency
                </label>
                <select
                  id="habit-frequency"
                  name="frequency"
                  value={habitForm.frequency}
                  onChange={handleHabitFormChange}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-0 ring-emerald-500/60 focus:border-emerald-500 focus:ring-2"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting
              ? editingHabitId
                ? "Saving habit..."
                : "Creating habit..."
              : editingHabitId
              ? "Save changes"
              : "Create habit"}
          </button>
        </form>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-white">Habit list</h2>
              {isLoading ? (
            <p className="text-xs text-slate-400">Loading habits...</p>
          ) : habits.length === 0 ? (
            <p className="text-xs text-slate-400">
              You do not have any habits yet. Create your first one to get
              started.
            </p>
          ) : (
            <ul className="space-y-2">
              {habits.map((habit) => (
                <li
                  key={habit._id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {habit.name}
                    </p>
                    {habit.description && (
                      <p className="mt-1 text-xs text-slate-400">
                        {habit.description}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
                      {habit.category} • {habit.frequency}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => handleStartEditHabit(habit)}
                      className="rounded-md border border-slate-700 px-2 py-1 text-[11px] font-medium text-slate-100 transition hover:border-emerald-500 hover:text-emerald-300"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteHabit(habit._id)}
                      className="rounded-md border border-red-500/60 px-2 py-1 text-[11px] font-medium text-red-200 transition hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCheckin(habit._id)}
                      className="rounded-md bg-emerald-500 px-2 py-1 text-[11px] font-medium text-slate-950 transition hover:bg-emerald-400"
                    >
                      Check‑in
                    </button>
                    <button
                      type="button"
                      onClick={() => openStats(habit)}
                      className="rounded-md border border-slate-700 px-2 py-1 text-[11px] font-medium text-slate-100 transition hover:border-emerald-500 hover:text-emerald-300"
                    >
                      Stats
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>

      {/* Stats modal */}
      {statsModal.open && statsModal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-w-2xl rounded-lg bg-slate-900 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{statsModal.data.habitName} — Stats</h3>
                <p className="mt-1 text-xs text-slate-400">{statsModal.data.category} • {statsModal.data.frequency}</p>
              </div>
              <button onClick={closeStats} className="text-slate-400">Close</button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-md border border-slate-800 bg-slate-800/30 p-3 text-sm">
                <div className="text-xs text-slate-400">Total checkins</div>
                <div className="mt-1 text-lg font-semibold text-white">{statsModal.data.totalCheckins}</div>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-800/30 p-3 text-sm">
                <div className="text-xs text-slate-400">Completed</div>
                <div className="mt-1 text-lg font-semibold text-white">{statsModal.data.completedCheckins}</div>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-800/30 p-3 text-sm">
                <div className="text-xs text-slate-400">Success rate</div>
                <div className="mt-1 text-lg font-semibold text-white">{statsModal.data.successRate}%</div>
              </div>
            </div>

            <div className="mt-4 text-sm">
              <div className="mb-2 text-xs text-slate-400">Current streak / Longest</div>
              <div className="flex items-center gap-4">
                <div className="rounded-md bg-emerald-600/20 px-3 py-1 text-white">{statsModal.data.currentStreak} days</div>
                <div className="rounded-md bg-slate-700/30 px-3 py-1 text-slate-200">{statsModal.data.longestStreak} days</div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="mb-2 text-sm font-medium text-white">Last 30 days</h4>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {Object.entries(statsModal.data.last30Days || {}).map(([date, info]) => (
                  <div key={date} className={`rounded-md border px-2 py-1 ${info && info.completed ? 'bg-emerald-500/20 border-emerald-500' : 'bg-slate-800/20 border-slate-700'}`}>
                    <div className="font-medium text-white">{date.slice(5)}</div>
                    <div className="text-xs text-slate-400">{info && info.completed ? 'Done' : '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitsPage;


