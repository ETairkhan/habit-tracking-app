import React, { useEffect, useMemo, useState } from "react";
import { apiClient } from "../apiClient.js";
import HabitMiniCalendar from "../components/HabitMiniCalendar.jsx";

const emptyHabitForm = {
  name: "",
  description: "",
  category: "other",
  frequency: "daily",
  daysOfWeek: [],
};

const DOW = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const pad2 = (n) => String(n).padStart(2, "0");
const monthKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;

const HabitsPage = () => {
  const [habits, setHabits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serverError, setServerError] = useState("");

  const [habitForm, setHabitForm] = useState(emptyHabitForm);
  const [habitFormErrors, setHabitFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState(null);

  // календарь: текущий месяц
  const [calendarCursor, setCalendarCursor] = useState(() => new Date());
  const currentMonth = useMemo(() => monthKey(calendarCursor), [calendarCursor]);

  // checkins: Map habitId -> Set(dateKeys)
  const [checkinsMap, setCheckinsMap] = useState(new Map());
  const [isCheckinsLoading, setIsCheckinsLoading] = useState(false);

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

  const handleFetchCheckins = async () => {
    setIsCheckinsLoading(true);
    setServerError("");
    try {
      const response = await apiClient.get(`/checkins?month=${currentMonth}`);
      const list = response.data; // [{habit, date, completed}]

      const nextMap = new Map();
      for (const item of list) {
        const habitId = item.habit;
        if (!nextMap.has(habitId)) nextMap.set(habitId, new Set());
        nextMap.get(habitId).add(item.date);
      }
      setCheckinsMap(nextMap);
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to load calendar. Please retry.";
      setServerError(message);
    } finally {
      setIsCheckinsLoading(false);
    }
  };

  useEffect(() => {
    handleFetchHabits();
  }, []);

  useEffect(() => {
    // когда меняется месяц — перезагружаем отметки
    handleFetchCheckins();
  }, [currentMonth]);

  const handleHabitFormChange = (event) => {
    const fieldName = event.target.name;
    const fieldValue = event.target.value;

    setHabitForm((previousState) => ({
      ...previousState,
      [fieldName]: fieldValue,
    }));
  };

  const toggleDayOfWeek = (dayKey) => {
    setHabitForm((prev) => {
      const set = new Set(prev.daysOfWeek || []);
      if (set.has(dayKey)) set.delete(dayKey);
      else set.add(dayKey);
      return { ...prev, daysOfWeek: Array.from(set) };
    });
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
      daysOfWeek: habit.daysOfWeek || [],
    });
    setHabitFormErrors({});
  };

  const validateHabitForm = () => {
    const nextErrors = {};
    if (!habitForm.name.trim()) {
      nextErrors.name = "Habit name is required";
    }

    // если weekly/custom — можно требовать daysOfWeek, но я оставил мягко: разрешаем пусто
    setHabitFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmitHabit = async (event) => {
    event.preventDefault();
    setServerError("");

    const isValid = validateHabitForm();
    if (!isValid) return;

    setIsSubmitting(true);

    try {
      const payload = {
        name: habitForm.name.trim(),
        description: habitForm.description.trim(),
        category: habitForm.category,
        frequency: habitForm.frequency,
        daysOfWeek: habitForm.daysOfWeek || [],
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
    const isConfirmed = window.confirm("Are you sure you want to delete this habit?");
    if (!isConfirmed) return;

    try {
      await apiClient.delete(`/habits/${habitId}`);
      setHabits((previousHabits) =>
        previousHabits.filter((habitItem) => habitItem._id !== habitId)
      );

      // подчистим календарные отметки
      setCheckinsMap((prev) => {
        const next = new Map(prev);
        next.delete(habitId);
        return next;
      });

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

  const handleToggleCheckin = async (habitId, dateKey) => {
    try {
      // оптимистично обновим UI
      setCheckinsMap((prev) => {
        const next = new Map(prev);
        const set = new Set(next.get(habitId) || []);
        if (set.has(dateKey)) set.delete(dateKey);
        else set.add(dateKey);
        next.set(habitId, set);
        return next;
      });

      await apiClient.post("/checkins/toggle", { habitId, date: dateKey });
    } catch (error) {
      // откатим, если сервер упал
      await handleFetchCheckins();
      const message =
        error.response?.data?.message || "Failed to toggle completion. Please retry.";
      setServerError(message);
    }
  };

  const monthLabel = useMemo(() => {
    const d = new Date(calendarCursor);
    return d.toLocaleString(undefined, { month: "long", year: "numeric" });
  }, [calendarCursor]);

  const year = calendarCursor.getFullYear();
  const monthIndex = calendarCursor.getMonth();

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Your Habits</h1>
          <p className="mt-1 text-sm text-slate-400">
            Create habits and track them on the calendar next to each habit.
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

      {/* Переключатель месяца календаря */}
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2">
        <div className="text-sm font-medium text-white">
          Calendar: <span className="text-emerald-300">{monthLabel}</span>
          {isCheckinsLoading && (
            <span className="ml-2 text-xs text-slate-400">(loading...)</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCalendarCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-100 hover:border-emerald-500 hover:text-emerald-300"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setCalendarCursor(new Date())}
            className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-100 hover:border-emerald-500 hover:text-emerald-300"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setCalendarCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-100 hover:border-emerald-500 hover:text-emerald-300"
          >
            Next
          </button>
        </div>
      </div>

      <section className="grid gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* FORM */}
        <form
          onSubmit={handleSubmitHabit}
          className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
        >
          <h2 className="mb-3 text-sm font-medium text-white">
            {editingHabitId ? "Edit habit" : "Create a new habit"}
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <label htmlFor="habit-name" className="block text-xs font-medium text-slate-300">
                Habit name
              </label>
              <input
                id="habit-name"
                name="name"
                type="text"
                value={habitForm.name}
                onChange={handleHabitFormChange}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-0 ring-emerald-500/60 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2"
                placeholder="Read 20 pages"
                aria-invalid={Boolean(habitFormErrors.name)}
                required
              />
              {habitFormErrors.name && (
                <p className="mt-1 text-xs text-red-300">{habitFormErrors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="habit-description" className="block text-xs font-medium text-slate-300">
                Description (optional)
              </label>
              <textarea
                id="habit-description"
                name="description"
                value={habitForm.description}
                onChange={handleHabitFormChange}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-0 ring-emerald-500/60 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2"
                rows={3}
                placeholder="Reading during the day"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="habit-category" className="block text-xs font-medium text-slate-300">
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
                <label htmlFor="habit-frequency" className="block text-xs font-medium text-slate-300">
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
                  <option value="weekly">Weekly (days)</option>
                  <option value="custom">Custom (days)</option>
                </select>
              </div>
            </div>

            {(habitForm.frequency === "weekly" || habitForm.frequency === "custom") && (
              <div>
                <p className="text-xs font-medium text-slate-300">Days of week (optional)</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DOW.map((d) => {
                    const active = (habitForm.daysOfWeek || []).includes(d.key);
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => toggleDayOfWeek(d.key)}
                        className={
                          active
                            ? "rounded-md bg-emerald-500 px-2 py-1 text-xs font-semibold text-slate-950"
                            : "rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-100 hover:border-emerald-500 hover:text-emerald-300"
                        }
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  If you leave it empty, the calendar will treat it as “required every day”.
                </p>
              </div>
            )}
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

        {/* LIST + CALENDAR */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-white">Habit list</h2>

          {isLoading ? (
            <p className="text-xs text-slate-400">Loading habits...</p>
          ) : habits.length === 0 ? (
            <p className="text-xs text-slate-400">
              You do not have any habits yet. Create your first one to get started.
            </p>
          ) : (
            <ul className="space-y-2">
              {habits.map((habit) => {
                const completedSet = checkinsMap.get(habit._id) || new Set();

                return (
                  <li
                    key={habit._id}
                    className="grid gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,300px)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{habit.name}</p>
                        {habit.description && (
                          <p className="mt-1 text-xs text-slate-400">{habit.description}</p>
                        )}
                        <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
                          {habit.category} • {habit.frequency}
                        </p>

                        {habit.daysOfWeek?.length > 0 && (
                          <p className="mt-1 text-[11px] text-slate-500">
                            Days: {habit.daysOfWeek.join(", ")}
                          </p>
                        )}
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
                      </div>
                    </div>

                    <HabitMiniCalendar
                      habit={habit}
                      year={year}
                      monthIndex={monthIndex}
                      completedSet={completedSet}
                      onToggleDay={(dateKey) => handleToggleCheckin(habit._id, dateKey)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </section>
    </div>
  );
};

export default HabitsPage;
