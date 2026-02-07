import { validationResult } from "express-validator";
import { Checkin } from "../models/Checkin.js";
import { Habit } from "../models/Habit.js";
import { User } from "../models/User.js";
import mongoose from "mongoose";

export const createCheckin = async (req, res, next) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() });
  }

  try {
    const { habitId } = req.params;
    const { date, completed, notes, skipReason, skipReasonText, quality } = req.body;

    // Проверить, что привычка принадлежит пользователю
    const habit = await Habit.findOne({
      _id: habitId,
      user: req.user.id,
    });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    // Проверить, нет ли уже чекина на эту дату
    const existingCheckin = await Checkin.findOne({
      habit: habitId,
      user: req.user.id,
      date: new Date(date).toDateString(),
    });

    if (existingCheckin) {
      return res
        .status(400)
        .json({ message: "Checkin for this date already exists" });
    }

    const checkin = await Checkin.create({
      user: req.user.id,
      habit: habitId,
      date: new Date(date),
      completed: completed !== undefined ? completed : true,
      notes,
      skipReason: !completed ? skipReason : null,
      skipReasonText: !completed && skipReason === "other" ? skipReasonText : null,
      quality: completed ? quality : null,
    });

    // Добавить XP за чек-ин
    const xpGained = completed ? (quality || 1) * 10 : 0;
    if (xpGained > 0) {
      const user = await User.findById(req.user.id);
      if (user) {
        user.stats.totalXP += xpGained;
        // Обновить уровень если нужно
        const levelData = calculateLevel(user.stats.totalXP);
        user.stats.level = levelData.level;
        user.stats.nextLevelXP = levelData.nextLevelXP;
        await user.save();
      }
    }

    // Обновить статистику привычки и记录разрыв streak
    if (!completed && habit.currentStreak > 0) {
      habit.lastBrokenDate = new Date(date);
      habit.lastBrokenReason = skipReason;
    }
    await updateHabitStats(habitId);

    return res.status(201).json(checkin);
  } catch (error) {
    return next(error);
  }
};

export const getHabitStats = async (req, res, next) => {
  try {
    const { habitId } = req.params;

    const habit = await Habit.findOne({
      _id: habitId,
      user: req.user.id,
    });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    // Получить все чекины для этой привычки
    const checkins = await Checkin.find({
      habit: habitId,
      user: req.user.id,
    }).sort({ date: -1 });

    const completedCheckins = checkins.filter((c) => c.completed);
    const totalCheckins = checkins.length;
    const successRate =
      totalCheckins > 0
        ? Math.round((completedCheckins.length / totalCheckins) * 100)
        : 0;

    // Расчет текущей streak (непрерывные дни с выполнением)
    const currentStreak = calculateCurrentStreak(checkins);
    const longestStreak = calculateLongestStreak(checkins);

    // Статистика по дням (последние 30 дней)
    const last30Days = generateLast30DaysStats(checkins);

    return res.json({
      habitId,
      habitName: habit.name,
      category: habit.category,
      frequency: habit.frequency,
      totalCheckins,
      completedCheckins: completedCheckins.length,
      successRate,
      currentStreak,
      longestStreak,
      lastCheckinDate:
        checkins.length > 0 ? checkins[0].date : habit.startDate,
      last30Days,
      recentCheckins: checkins.slice(0, 10),
    });
  } catch (error) {
    return next(error);
  }
};

export const updateCheckin = async (req, res, next) => {
  try {
    const { habitId, checkinId } = req.params;
    const { completed, notes } = req.body;

    const checkin = await Checkin.findOne({
      _id: checkinId,
      habit: habitId,
      user: req.user.id,
    });

    if (!checkin) {
      return res.status(404).json({ message: "Checkin not found" });
    }

    if (completed !== undefined) {
      checkin.completed = completed;
    }
    if (notes !== undefined) {
      checkin.notes = notes;
    }

    const updatedCheckin = await checkin.save();

    // Обновить статистику привычки
    await updateHabitStats(habitId);

    return res.json(updatedCheckin);
  } catch (error) {
    return next(error);
  }
};

export const deleteCheckin = async (req, res, next) => {
  try {
    const { habitId, checkinId } = req.params;

    const checkin = await Checkin.findOneAndDelete({
      _id: checkinId,
      habit: habitId,
      user: req.user.id,
    });

    if (!checkin) {
      return res.status(404).json({ message: "Checkin not found" });
    }

    // Обновить статистику привычки
    await updateHabitStats(habitId);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

export const getCheckinsByDateRange = async (req, res, next) => {
  try {
    const { habitId } = req.params;
    const { startDate, endDate } = req.query;

    const habit = await Habit.findOne({
      _id: habitId,
      user: req.user.id,
    });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    const query = {
      habit: habitId,
      user: req.user.id,
    };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const checkins = await Checkin.find(query).sort({ date: -1 });

    return res.json(checkins);
  } catch (error) {
    return next(error);
  }
};

// ===== Helper функции

function calculateCurrentStreak(checkins) {
  if (checkins.length === 0) return 0;

  const sortedByDate = [...checkins].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  let streak = 0;
  const today = new Date();
  let currentDate = new Date(today.toDateString());

  for (const checkin of sortedByDate) {
    const checkinDate = new Date(checkin.date.toDateString());

    if (!checkin.completed) continue;

    if (
      checkinDate.getTime() ===
      new Date(currentDate.getTime() - streak * 24 * 60 * 60 * 1000).getTime()
    ) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function calculateLongestStreak(checkins) {
  if (checkins.length === 0) return 0;

  const sortedByDate = [...checkins].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  let maxStreak = 0;
  let currentStreak = 0;

  for (const checkin of sortedByDate) {
    if (checkin.completed) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
}

function generateLast30DaysStats(checkins) {
  const stats = {};
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const dayCheckin = checkins.find(
      (c) => new Date(c.date).toISOString().split("T")[0] === dateStr
    );

    stats[dateStr] = {
      completed: dayCheckin ? dayCheckin.completed : null,
      notes: dayCheckin ? dayCheckin.notes : null,
    };
  }

  return stats;
}

async function updateHabitStats(habitId) {
  try {
    const checkins = await Checkin.find({ habit: habitId });
    const completedCheckins = checkins.filter((c) => c.completed);

    const habit = await Habit.findById(habitId);
    if (habit) {
      habit.totalCompleted = completedCheckins.length;
      habit.successRate =
        checkins.length > 0
          ? Math.round((completedCheckins.length / checkins.length) * 100)
          : 0;
      habit.currentStreak = calculateCurrentStreak(checkins);
      habit.longestStreak = calculateLongestStreak(checkins);
      await habit.save();
    }
  } catch (error) {
    console.error("Error updating habit stats:", error);
  }
}
// ===== Новые endpoint handlers =====

export const getHeatmapData = async (req, res, next) => {
  try {
    const { habitId } = req.params;
    const { monthOffset = 0 } = req.query;

    const habit = await Habit.findOne({
      _id: habitId,
      user: req.user.id,
    });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    // Вычислить дату начала месяца
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    const checkins = await Checkin.find({
      habit: habitId,
      user: req.user.id,
      date: { $gte: startDate, $lte: endDate },
    });

    const heatmapData = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const dayCheckin = checkins.find(
        (c) => new Date(c.date).toISOString().split("T")[0] === dateStr
      );

      heatmapData[dateStr] = {
        completed: dayCheckin ? dayCheckin.completed : null,
        quality: dayCheckin?.quality || null,
        skipReason: dayCheckin?.skipReason || null,
        notes: dayCheckin?.notes || null,
      };
    }

    return res.json({
      month: startDate.toISOString().split("T")[0],
      heatmapData,
      stats: {
        totalDays: Object.keys(heatmapData).length,
        completed: Object.values(heatmapData).filter((d) => d.completed === true).length,
        skipped: Object.values(heatmapData).filter((d) => d.completed === false).length,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getProgressTrend = async (req, res, next) => {
  try {
    const { habitId } = req.params;
    const { days = 30 } = req.query;

    const habit = await Habit.findOne({
      _id: habitId,
      user: req.user.id,
    });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const checkins = await Checkin.find({
      habit: habitId,
      user: req.user.id,
      date: { $gte: startDate },
    }).sort({ date: 1 });

    // Группировать по неделям
    const weeklyData = {};
    checkins.forEach((checkin) => {
      const date = new Date(checkin.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { completed: 0, total: 0 };
      }
      weeklyData[weekKey].total++;
      if (checkin.completed) weeklyData[weekKey].completed++;
    });

    const trendData = Object.entries(weeklyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data]) => ({
        week,
        successRate: Math.round((data.completed / data.total) * 100),
        completed: data.completed,
        total: data.total,
      }));

    // Вычислить тренд
    const trend =
      trendData.length > 1
        ? trendData[trendData.length - 1].successRate - trendData[0].successRate
        : 0;

    return res.json({
      habitId,
      habitName: habit.name,
      trendData,
      trend,
      trend_direction: trend > 5 ? "improving" : trend < -5 ? "declining" : "stable",
      trend_percentage: Math.abs(trend),
    });
  } catch (error) {
    return next(error);
  }
};

export const getInsights = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Получить все привычки и чек-ины
    const habits = await Habit.find({ user: userId });
    const habitIds = habits.map((h) => h._id);

    const checkins = await Checkin.find({
      user: userId,
      habit: { $in: habitIds },
    });

    const insights = [];

    // Insight 1: Best day of week
    const dayStats = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    checkins.forEach((c) => {
      if (c.completed) {
        dayStats[dayNames[new Date(c.date).getDay()]]++;
      }
    });
    const bestDay = Object.entries(dayStats).sort((a, b) => b[1] - a[1])[0];
    if (bestDay[1] > 0) {
      insights.push({
        type: "best_day",
        text: `🎯 Ты чаще выполняешь привычки по ${bestDay[0]}`,
        value: bestDay[1],
      });
    }

    // Insight 2: Most skipped reason
    const skipReasons = {};
    checkins
      .filter((c) => !c.completed && c.skipReason)
      .forEach((c) => {
        skipReasons[c.skipReason] = (skipReasons[c.skipReason] || 0) + 1;
      });
    const topReason = Object.entries(skipReasons).sort((a, b) => b[1] - a[1])[0];
    if (topReason) {
      const reasonLabels = {
        "no-time": "нет времени",
        tired: "усталость",
        forgot: "забыл",
        "no-motivation": "отсутствие мотивации",
        other: "другое",
      };
      const percentage = Math.round(
        (topReason[1] / checkins.filter((c) => !c.completed).length) * 100
      );
      insights.push({
        type: "skip_reason",
        text: `❌ Основная причина пропусков — ${reasonLabels[topReason[0]]} (${percentage}%)`,
        value: topReason[1],
      });
    }

    // Insight 3: Streak performance
    const habitsWithStreaks = habits.filter((h) => h.currentStreak > 0).sort((a, b) => b.currentStreak - a.currentStreak);
    if (habitsWithStreaks.length > 0) {
      insights.push({
        type: "best_streak",
        text: `🔥 Твой лучший стрик: ${habitsWithStreaks[0].currentStreak} дней в "${habitsWithStreaks[0].name}"`,
        value: habitsWithStreaks[0].currentStreak,
      });
    }

    // Insight 4: Overall success rate
    const totalCompleted = checkins.filter((c) => c.completed).length;
    const overallRate = checkins.length > 0 ? Math.round((totalCompleted / checkins.length) * 100) : 0;
    insights.push({
      type: "overall_rate",
      text: `📊 Твой процент выполнения: ${overallRate}%`,
      value: overallRate,
    });

    return res.json(insights);
  } catch (error) {
    return next(error);
  }
};

export const getStreakDetails = async (req, res, next) => {
  try {
    const { habitId } = req.params;

    const habit = await Habit.findOne({
      _id: habitId,
      user: req.user.id,
    });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    const checkins = await Checkin.find({
      habit: habitId,
      user: req.user.id,
    }).sort({ date: -1 });

    return res.json({
      habitId,
      habitName: habit.name,
      currentStreak: habit.currentStreak || 0,
      longestStreak: habit.longestStreak || 0,
      lastBrokenDate: habit.lastBrokenDate,
      lastBrokenReason: habit.lastBrokenReason,
      startedToday: habit.currentStreak > 0 && checkIsToday(checkins[0]?.date),
      recentHistory: checkins.slice(0, 7),
    });
  } catch (error) {
    return next(error);
  }
};

// ===== Helper functions =====

function calculateLevel(totalXP) {
  // 100 XP за уровень
  const level = Math.floor(totalXP / 100) + 1;
  const nextLevelXP = level * 100;
  return { level, nextLevelXP };
}

function checkIsToday(date) {
  if (!date) return false;
  const today = new Date();
  const checkDate = new Date(date);
  return (
    today.getDate() === checkDate.getDate() &&
    today.getMonth() === checkDate.getMonth() &&
    today.getFullYear() === checkDate.getFullYear()
  );
}