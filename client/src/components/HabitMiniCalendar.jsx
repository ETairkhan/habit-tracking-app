import React, { useMemo } from "react";
import PropTypes from "prop-types";

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const pad2 = (n) => String(n).padStart(2, "0");

const toDateKey = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const startOfMonth = (year, monthIndex) => new Date(year, monthIndex, 1);
const daysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

// JS: 0=Sun..6=Sat -> нам нужно Mon..Sun
const jsDowToMonIndex = (jsDow) => (jsDow === 0 ? 6 : jsDow - 1);

// habit daysOfWeek: ["mon","tue"...]
const habitDowSet = (daysOfWeek = []) => new Set(daysOfWeek);

const dowKeyByMonIndex = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function isRequiredDay(habit, dateObj) {
  const freq = habit.frequency || "daily";

  if (freq === "daily") return true;

  const monIndex = jsDowToMonIndex(dateObj.getDay());
  const key = dowKeyByMonIndex[monIndex];

  // weekly/custom: если daysOfWeek пустой — считаем, что требуется каждый день (чтобы календарь не был пустой)
  const set = habitDowSet(habit.daysOfWeek);
  if (set.size === 0) return true;

  return set.has(key);
}

const HabitMiniCalendar = ({
  habit,
  year,
  monthIndex,
  completedSet,
  onToggleDay,
}) => {
  const grid = useMemo(() => {
    const first = startOfMonth(year, monthIndex);
    const firstMonIndex = jsDowToMonIndex(first.getDay());
    const total = daysInMonth(year, monthIndex);

    // 6 недель * 7 = 42 ячейки
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const dayNum = i - firstMonIndex + 1; // 1..total
      if (dayNum < 1 || dayNum > total) {
        cells.push(null);
      } else {
        cells.push(new Date(year, monthIndex, dayNum));
      }
    }
    return cells;
  }, [year, monthIndex]);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/30 p-2">
      <div className="grid grid-cols-7 gap-1 text-[10px] text-slate-500">
        {WEEK.map((d) => (
          <div key={d} className="text-center">
            {d}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {grid.map((dateObj, idx) => {
          if (!dateObj) {
            return <div key={idx} className="h-7 rounded-md" />;
          }

          const key = toDateKey(dateObj);
          const completed = completedSet?.has(key);
          const required = isRequiredDay(habit, dateObj);

          const base =
            "h-7 rounded-md text-[11px] flex items-center justify-center select-none transition";
          const styles = completed
            ? "bg-emerald-500 text-slate-950 font-semibold"
            : required
            ? "border border-slate-700 text-slate-100 hover:border-emerald-500 hover:text-emerald-300 cursor-pointer"
            : "border border-slate-900 text-slate-600";

          return (
            <button
              key={key}
              type="button"
              onClick={() => required && onToggleDay(key)}
              className={`${base} ${styles}`}
              title={
                completed
                  ? "Completed (click to undo)"
                  : required
                  ? "Required (click to mark done)"
                  : "Not required"
              }
            >
              {dateObj.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
        <span className="inline-flex h-3 w-3 rounded-sm bg-emerald-500" />
        Completed
        <span className="ml-2 inline-flex h-3 w-3 rounded-sm border border-slate-700" />
        Required
      </div>
    </div>
  );
};

HabitMiniCalendar.propTypes = {
  habit: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    frequency: PropTypes.string,
    daysOfWeek: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  year: PropTypes.number.isRequired,
  monthIndex: PropTypes.number.isRequired,
  completedSet: PropTypes.instanceOf(Set),
  onToggleDay: PropTypes.func.isRequired,
};

export default HabitMiniCalendar;
