import { validationResult } from "express-validator";
import { Habit } from "../models/Habit.js";
import { HabitCheckin } from "../models/HabitCheckin.js";

const isValidDateKey = (dateKey) => /^\d{4}-\d{2}-\d{2}$/.test(dateKey);

export const getCheckinsForMonth = async (req, res, next) => {
  try {
    const month = req.query.month; // YYYY-MM
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: "Query 'month' must be in YYYY-MM format" });
    }

    const start = `${month}-01`;
    const endMonthNum = Number(month.slice(5, 7));
    const endYearNum = Number(month.slice(0, 4));
    const nextMonthYear = endMonthNum === 12 ? endYearNum + 1 : endYearNum;
    const nextMonth = endMonthNum === 12 ? 1 : endMonthNum + 1;
    const nextMonthKey = `${String(nextMonthYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-01`;

    const checkins = await HabitCheckin.find({
      user: req.user.id,
      date: { $gte: start, $lt: nextMonthKey },
      completed: true,
    }).select("habit date completed");

    return res.json(checkins);
  } catch (error) {
    return next(error);
  }
};

export const toggleCheckin = async (req, res, next) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() });
  }

  try {
    const { habitId, date } = req.body; // date = YYYY-MM-DD
    if (!isValidDateKey(date)) {
      return res.status(400).json({ message: "date must be YYYY-MM-DD" });
    }

    const habit = await Habit.findOne({ _id: habitId, user: req.user.id });
    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    // найти существующий чек-ин
    const existing = await HabitCheckin.findOne({
      user: req.user.id,
      habit: habitId,
      date,
    });

    // если есть — переключаем (completed true/false)
    if (existing) {
      existing.completed = !existing.completed;
      await existing.save();
      return res.json(existing);
    }

    // если нет — создаём completed=true
    const created = await HabitCheckin.create({
      user: req.user.id,
      habit: habitId,
      date,
      completed: true,
    });

    return res.status(201).json(created);
  } catch (error) {
    // если поймали конфликт уникального индекса — просто перечитаем и отдадим
    if (error?.code === 11000) {
      const found = await HabitCheckin.findOne({
        user: req.user.id,
        habit: req.body.habitId,
        date: req.body.date,
      });
      return res.json(found);
    }
    return next(error);
  }
};
