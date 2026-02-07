import { Day } from "../models/Day.js";
import { Habit } from "../models/Habit.js";

// Создать новый день
export const createDay = async (req, res) => {
  try {
    const { date, habits, dayNotes, mood, energy, tags } = req.body;
    const userId = req.user.id;

    // Проверка: день уже существует?
    const existingDay = await Day.findOne({
      user: userId,
      date: new Date(date).toDateString(),
    });

    if (existingDay) {
      return res
        .status(400)
        .json({ error: "День уже существует на эту дату" });
    }

    // Проверка привычек
    let dayHabits = [];
    if (habits && habits.length > 0) {
      const habitList = await Habit.find({
        _id: { $in: habits },
        user: userId,
      });

      if (habitList.length !== habits.length) {
        return res.status(400).json({ error: "Некоторые привычки не найдены" });
      }

      dayHabits = habits.map((habitId) => ({
        habit: habitId,
        completed: false,
        quality: null,
        notes: "",
      }));
    }

    const newDay = new Day({
      user: userId,
      date: new Date(date),
      habits: dayHabits,
      dayNotes: dayNotes || "",
      mood: mood || null,
      energy: energy || null,
      tags: tags || [],
      totalHabits: dayHabits.length,
      completedHabits: 0,
      daySuccessRate: 0,
      status: "planned",
    });

    await newDay.save();
    await newDay.populate("habits.habit");

    res.status(201).json(newDay);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Получить дни пользователя (с фильтрацией по дате)
export const getUserDays = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, status } = req.query;

    let query = { user: userId };

    // Фильтр по диапазону дат
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Фильтр по статусу
    if (status) {
      query.status = status;
    }

    const days = await Day.find(query)
      .sort({ date: -1 })
      .populate("habits.habit");

    res.json(days);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Получить день по ID
export const getDayById = async (req, res) => {
  try {
    const { dayId } = req.params;
    const userId = req.user.id;

    const day = await Day.findOne({
      _id: dayId,
      user: userId,
    }).populate("habits.habit");

    if (!day) {
      return res.status(404).json({ error: "День не найден" });
    }

    res.json(day);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Обновить день
export const updateDay = async (req, res) => {
  try {
    const { dayId } = req.params;
    const userId = req.user.id;
    const { dayNotes, mood, energy, tags, status } = req.body;

    const day = await Day.findOne({ _id: dayId, user: userId });

    if (!day) {
      return res.status(404).json({ error: "День не найден" });
    }

    // Обновляем поля
    if (dayNotes !== undefined) day.dayNotes = dayNotes;
    if (mood !== undefined) day.mood = mood;
    if (energy !== undefined) day.energy = energy;
    if (tags !== undefined) day.tags = tags;
    if (status !== undefined) day.status = status;

    await day.save();
    await day.populate("habits.habit");

    res.json(day);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Добавить привычку к дню
export const addHabitToDay = async (req, res) => {
  try {
    const { dayId } = req.params;
    const { habitId } = req.body;
    const userId = req.user.id;

    const day = await Day.findOne({ _id: dayId, user: userId });

    if (!day) {
      return res.status(404).json({ error: "День не найден" });
    }

    // Проверка: привычка существует?
    const habit = await Habit.findOne({ _id: habitId, user: userId });

    if (!habit) {
      return res.status(404).json({ error: "Привычка не найдена" });
    }

    // Проверка: привычка уже в этом дне?
    if (day.habits.some((h) => h.habit.toString() === habitId)) {
      return res
        .status(400)
        .json({ error: "Привычка уже добавлена в этот день" });
    }

    day.habits.push({
      habit: habitId,
      completed: false,
      quality: null,
      notes: "",
    });

    day.totalHabits = day.habits.length;
    day.daySuccessRate =
      day.totalHabits > 0 ? (day.completedHabits / day.totalHabits) * 100 : 0;

    await day.save();
    await day.populate("habits.habit");

    res.json(day);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Удалить привычку из дня
export const removeHabitFromDay = async (req, res) => {
  try {
    const { dayId, habitId } = req.params;
    const userId = req.user.id;

    const day = await Day.findOne({ _id: dayId, user: userId });

    if (!day) {
      return res.status(404).json({ error: "День не найден" });
    }

    day.habits = day.habits.filter((h) => h.habit.toString() !== habitId);

    day.totalHabits = day.habits.length;
    day.completedHabits = day.habits.filter((h) => h.completed).length;
    day.daySuccessRate =
      day.totalHabits > 0 ? (day.completedHabits / day.totalHabits) * 100 : 0;

    await day.save();
    await day.populate("habits.habit");

    res.json(day);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Отметить привычку как выполненную
export const checkHabitInDay = async (req, res) => {
  try {
    const { dayId, habitId } = req.params;
    const { completed, quality, notes } = req.body;
    const userId = req.user.id;

    const day = await Day.findOne({ _id: dayId, user: userId });

    if (!day) {
      return res.status(404).json({ error: "День не найден" });
    }

    const habitEntry = day.habits.find((h) => h.habit.toString() === habitId);

    if (!habitEntry) {
      return res
        .status(404)
        .json({ error: "Привычка не найдена в этом дне" });
    }

    habitEntry.completed = completed;
    if (quality !== undefined) habitEntry.quality = quality;
    if (notes !== undefined) habitEntry.notes = notes;
    if (completed) habitEntry.checkedAt = new Date();

    // Пересчет статистики
    day.completedHabits = day.habits.filter((h) => h.completed).length;
    day.daySuccessRate =
      day.totalHabits > 0 ? (day.completedHabits / day.totalHabits) * 100 : 0;

    await day.save();
    await day.populate("habits.habit");

    res.json(day);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Удалить день
export const deleteDay = async (req, res) => {
  try {
    const { dayId } = req.params;
    const userId = req.user.id;

    const day = await Day.findOneAndDelete({ _id: dayId, user: userId });

    if (!day) {
      return res.status(404).json({ error: "День не найден" });
    }

    res.json({ message: "День удален успешно" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Получить месячный календарь дней пользователя
export const getMonthlyDays = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        error: "Требуются параметры year и month",
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);

    const days = await Day.find({
      user: userId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .sort({ date: 1 })
      .populate("habits.habit");

    // Создание календаря с днями или пустыми полями
    const monthDays = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month - 1, i);
      const dayData = days.find(
        (d) =>
          d.date.getDate() === i &&
          d.date.getMonth() === month - 1 &&
          d.date.getFullYear() === parseInt(year)
      );

      monthDays.push({
        date: date.toDateString(),
        day: dayData || null,
        dayOfWeek: date.toLocaleDateString("ru-RU", { weekday: "short" }),
      });
    }

    res.json({
      year: parseInt(year),
      month: parseInt(month),
      days: monthDays,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
