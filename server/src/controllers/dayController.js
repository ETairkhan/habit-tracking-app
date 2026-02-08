import { Day } from "../models/Day.js";
import { Habit } from "../models/Habit.js";

// Normalize date to ISO string format (YYYY-MM-DD)
const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
};

// Create a new day
export const createDay = async (req, res) => {
  try {
    const { date, habits, dayNotes, mood, energy, tags } = req.body;
    const userId = req.user.id;

    // Parse and normalize the date - treat date string as UTC
    // Input format: "YYYY-MM-DD" (no timezone info)
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day));
    
    // Check if day already exists for this user on this date
    const existingDay = await Day.findOne({
      user: userId,
      date: dateObj,
    }).populate("habits.habit");

    // If day exists, update it instead of creating a new one
    if (existingDay) {
      if (dayNotes !== undefined) existingDay.dayNotes = dayNotes;
      if (mood !== undefined) existingDay.mood = mood;
      if (energy !== undefined) existingDay.energy = energy;
      if (tags !== undefined) existingDay.tags = tags;

      // Add new habits if provided
      if (habits && habits.length > 0) {
        const habitList = await Habit.find({
          _id: { $in: habits },
          user: userId,
        });

        if (habitList.length !== habits.length) {
          return res.status(400).json({ error: "Некоторые привычки не существуют" });
        }

        // Add only new habits that aren't already in the day
        habits.forEach((habitId) => {
          if (!existingDay.habits.some((h) => h.habit._id.toString() === habitId)) {
            existingDay.habits.push({
              habit: habitId,
              completed: false,
              quality: null,
              notes: "",
            });
          }
        });

        existingDay.totalHabits = existingDay.habits.length;
      }

      await existingDay.save();
      await existingDay.populate("habits.habit");
      return res.status(200).json(existingDay);
    }

    // Create new day if it doesn't exist
    // Validate habits
    let dayHabits = [];
    if (habits && habits.length > 0) {
      const habitList = await Habit.find({
        _id: { $in: habits },
        user: userId,
      });

      if (habitList.length !== habits.length) {
        return res.status(400).json({ error: "Некоторые привычки не существуют" });
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
      date: dateObj,
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
    console.error("Create day error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get all days for a user (with optional filtering)
export const getUserDays = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, status } = req.query;

    let query = { user: userId };

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Filter by status
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

// Get a specific day by ID
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

// Update a day
export const updateDay = async (req, res) => {
  try {
    const { dayId } = req.params;
    const userId = req.user.id;
    const { dayNotes, mood, energy, tags, status } = req.body;

    const day = await Day.findOne({ _id: dayId, user: userId });

    if (!day) {
      return res.status(404).json({ error: "День не найден" });
    }

    // Update fields
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

// Add a habit to a day
export const addHabitToDay = async (req, res) => {
  try {
    const { dayId } = req.params;
    const { habitId } = req.body;
    const userId = req.user.id;

    const day = await Day.findOne({ _id: dayId, user: userId });

    if (!day) {
      return res.status(404).json({ error: "День не найден" });
    }

    // Check if habit exists
    const habit = await Habit.findOne({ _id: habitId, user: userId });

    if (!habit) {
      return res.status(404).json({ error: "Привычка не найдена" });
    }

    // Check if habit is already in the day
    if (day.habits.some((h) => h.habit.toString() === habitId)) {
      return res.status(400).json({ error: "Привычка уже добавлена в этот день" });
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

// Remove a habit from a day
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

// Mark a habit as completed/incomplete in a day
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
      return res.status(404).json({ error: "Привычка не найдена в этом дне" });
    }

    habitEntry.completed = completed;
    if (quality !== undefined) habitEntry.quality = quality;
    if (notes !== undefined) habitEntry.notes = notes;
    if (completed) habitEntry.checkedAt = new Date();

    // Recalculate stats
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

// Delete a day
export const deleteDay = async (req, res) => {
  try {
    const { dayId } = req.params;
    const userId = req.user.id;

    const day = await Day.findOneAndDelete({ _id: dayId, user: userId });

    if (!day) {
      return res.status(404).json({ error: "День не найден" });
    }

    res.json({ message: "День успешно удален" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get monthly calendar view
export const getMonthlyDays = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        error: "Required parameters: year and month",
      });
    }

    const numYear = parseInt(year);
    const numMonth = parseInt(month);

    // Create proper date boundaries using UTC
    const startDate = new Date(Date.UTC(numYear, numMonth - 1, 1));
    const endDate = new Date(Date.UTC(numYear, numMonth, 0));
    // Set end date to end of last day of month
    endDate.setUTCHours(23, 59, 59, 999);

    const days = await Day.find({
      user: userId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .sort({ date: 1 })
      .populate("habits.habit");

    // Create map for O(1) lookup
    const dayMap = {};
    days.forEach(d => {
      const dateStr = d.date.toISOString().split("T")[0];
      dayMap[dateStr] = d;
    });

    // Generate calendar with null entries for missing days
    const monthDays = [];
    const daysInMonth = new Date(Date.UTC(numYear, numMonth, 0)).getUTCDate();
    const weekdayNames = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(Date.UTC(numYear, numMonth - 1, i));
      const dateStr = date.toISOString().split("T")[0];
      // Convert JS weekday (0=Sun) to ISO (0=Mon)
      const dayOfWeek = weekdayNames[(date.getUTCDay() + 6) % 7];

      monthDays.push({
        date: dateStr,
        day: dayMap[dateStr] || null,
        dayOfWeek,
      });
    }

    res.json({
      year: numYear,
      month: numMonth,
      days: monthDays,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
