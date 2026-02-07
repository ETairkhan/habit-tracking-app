import { validationResult } from "express-validator";
import { User } from "../models/User.js";
import { Habit } from "../models/Habit.js";
import { Checkin } from "../models/Checkin.js";
import mongoose from "mongoose";

export const getCurrentUserProfile = async (req, res, next) => {
  try {
    const foundUser = await User.findById(req.user.id).select("-password");

    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(foundUser);
  } catch (error) {
    return next(error);
  }
};

export const updateCurrentUserProfile = async (req, res, next) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() });
  }

  const { email, username, displayName } = req.body;

  try {
    const foundUser = await User.findById(req.user.id);

    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email && email !== foundUser.email) {
      const existingEmailUser = await User.findOne({ email });
      if (existingEmailUser) {
        return res
          .status(400)
          .json({ message: "Another user already uses this email" });
      }
      foundUser.email = email;
    }

    if (username && username !== foundUser.username) {
      const existingUsernameUser = await User.findOne({ username });
      if (existingUsernameUser) {
        return res
          .status(400)
          .json({ message: "Another user already uses this username" });
      }
      foundUser.username = username;
    }

    if (displayName) {
      foundUser.displayName = displayName;
    }

    const savedUser = await foundUser.save();

    return res.json({
      id: savedUser._id,
      username: savedUser.username,
      email: savedUser.email,
      role: savedUser.role,
      displayName: savedUser.displayName,
      settings: savedUser.settings,
      stats: savedUser.stats,
    });
  } catch (error) {
    return next(error);
  }
};

export const getUserStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Получить все привычки пользователя
    const habits = await Habit.find({ user: userId });

    if (habits.length === 0) {
      return res.json({
        totalHabits: 0,
        habitsByCategory: [],
        habitsByFrequency: [],
        topCategory: null,
        avgHabitsPerCategory: 0,
        totalCheckins: 0,
        totalCompletedCheckins: 0,
        overallSuccessRate: 0,
      });
    }

    // Группировать привычки по категориям
    const habitsByCategory = {};
    const habitsByFrequency = {};

    habits.forEach((habit) => {
      // По категориям
      if (!habitsByCategory[habit.category]) {
        habitsByCategory[habit.category] = {
          category: habit.category,
          count: 0,
          habits: [],
        };
      }
      habitsByCategory[habit.category].count += 1;
      habitsByCategory[habit.category].habits.push({
        id: habit._id,
        name: habit.name,
        successRate: habit.successRate || 0,
        currentStreak: habit.currentStreak || 0,
      });

      // По частоте
      if (!habitsByFrequency[habit.frequency]) {
        habitsByFrequency[habit.frequency] = {
          frequency: habit.frequency,
          count: 0,
        };
      }
      habitsByFrequency[habit.frequency].count += 1;
    });

    // Преобразовать в массивы и отсортировать
    const categoryArray = Object.values(habitsByCategory).sort(
      (a, b) => b.count - a.count
    );
    const frequencyArray = Object.values(habitsByFrequency);

    const topCategory = categoryArray.length > 0 ? categoryArray[0] : null;

    // Расчет среднего количества привычек на категорию
    const totalCategories = categoryArray.length;
    const avgHabitsPerCategory =
      totalCategories > 0
        ? Math.round((habits.length / totalCategories) * 10) / 10
        : 0;

    // Получить все чекины пользователя
    const checkins = await Checkin.find({ user: userId });
    const completedCheckins = checkins.filter((c) => c.completed);

    const overallSuccessRate =
      checkins.length > 0
        ? Math.round((completedCheckins.length / checkins.length) * 100)
        : 0;

    return res.json({
      userId,
      totalHabits: habits.length,
      totalCheckins: checkins.length,
      totalCompletedCheckins: completedCheckins.length,
      overallSuccessRate,
      habitsByCategory: categoryArray,
      habitsByFrequency: frequencyArray,
      topCategory: topCategory
        ? {
            category: topCategory.category,
            count: topCategory.count,
          }
        : null,
      avgHabitsPerCategory,
      topHabits: habits
        .sort((a, b) => (b.successRate || 0) - (a.successRate || 0))
        .slice(0, 5)
        .map((h) => ({
          id: h._id,
          name: h.name,
          successRate: h.successRate || 0,
          currentStreak: h.currentStreak || 0,
          longestStreak: h.longestStreak || 0,
        })),
    });
  } catch (error) {
    return next(error);
  }
};

// Category-specific statistics
export const getCategoryStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { category } = req.params;

    const habits = await Habit.find({ user: userId, category });
    const habitIds = habits.map(h => h._id);

    if (habitIds.length === 0) {
      return res.json({
        category,
        totalHabits: 0,
        totalCheckins: 0,
        completedCheckins: 0,
        successRate: 0,
        habits: [],
        topHabit: null,
      });
    }

    const checkins = await Checkin.find({ user: userId, habit: { $in: habitIds } });
    const completedCheckins = checkins.filter(c => c.completed);

    const habitStats = habits.map(habit => {
      const habitCheckins = checkins.filter(c => c.habit.equals(habit._id));
      const completed = habitCheckins.filter(c => c.completed).length;
      const successRate = habitCheckins.length > 0 ? Math.round((completed / habitCheckins.length) * 100) : 0;

      return {
        id: habit._id,
        name: habit.name,
        frequency: habit.frequency,
        totalCheckins: habitCheckins.length,
        completedCheckins: completed,
        successRate,
        currentStreak: habit.currentStreak || 0,
        longestStreak: habit.longestStreak || 0,
      };
    });

    const successRate = checkins.length > 0 ? Math.round((completedCheckins.length / checkins.length) * 100) : 0;

    return res.json({
      category,
      totalHabits: habits.length,
      totalCheckins: checkins.length,
      completedCheckins: completedCheckins.length,
      successRate,
      habits: habitStats.sort((a, b) => b.successRate - a.successRate),
      topHabit: habitStats.length > 0 ? habitStats[0] : null,
    });
  } catch (error) {
    return next(error);
  }
};

// Weekly comparison across all habits
export const getWeeklyStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const habits = await Habit.find({ user: userId });
    const habitIds = habits.map(h => h._id);

    const checkins = await Checkin.find({
      user: userId,
      habit: { $in: habitIds },
      date: { $gte: weekAgo },
    }).sort({ date: 1 });

    // Group by day of week and count completions
    const weekData = {
      Mon: { date: '', completed: 0, total: 0 },
      Tue: { date: '', completed: 0, total: 0 },
      Wed: { date: '', completed: 0, total: 0 },
      Thu: { date: '', completed: 0, total: 0 },
      Fri: { date: '', completed: 0, total: 0 },
      Sat: { date: '', completed: 0, total: 0 },
      Sun: { date: '', completed: 0, total: 0 },
    };

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    checkins.forEach(checkin => {
      const date = new Date(checkin.date);
      const dayName = dayNames[date.getDay()];
      const dateStr = date.toISOString().split('T')[0];

      if (!weekData[dayName].date) weekData[dayName].date = dateStr;
      weekData[dayName].total += 1;
      if (checkin.completed) weekData[dayName].completed += 1;
    });

    const weekArray = Object.entries(weekData).map(([day, data]) => ({
      day,
      ...data,
      successRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    }));

    return res.json({
      week: weekArray,
      totalCheckins: checkins.length,
      totalCompleted: checkins.filter(c => c.completed).length,
    });
  } catch (error) {
    return next(error);
  }
};

// Comprehensive dashboard stats
export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all habits
    const habits = await Habit.find({ user: userId });
    const habitIds = habits.map(h => h._id);

    // Get all checkins
    const checkins = await Checkin.find({ user: userId });
    const completedCheckins = checkins.filter(c => c.completed);

    // Group by category
    const categoryStats = {};
    habits.forEach(habit => {
      if (!categoryStats[habit.category]) {
        categoryStats[habit.category] = {
          category: habit.category,
          totalHabits: 0,
          totalCheckins: 0,
          completedCheckins: 0,
        };
      }
      categoryStats[habit.category].totalHabits += 1;

      const habitCheckins = checkins.filter(c => c.habit.equals(habit._id));
      categoryStats[habit.category].totalCheckins += habitCheckins.length;
      categoryStats[habit.category].completedCheckins += habitCheckins.filter(c => c.completed).length;
    });

    // Calculate success rate for each category
    const categories = Object.values(categoryStats).map(cat => ({
      ...cat,
      successRate: cat.totalCheckins > 0 ? Math.round((cat.completedCheckins / cat.totalCheckins) * 100) : 0,
    }));

    // Get last 7 days stats
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCheckins = checkins.filter(c => new Date(c.date) >= sevenDaysAgo);

    // Get best and worst habits
    const habitStats = habits.map(h => {
      const hCheckins = checkins.filter(c => c.habit.equals(h._id));
      return {
        id: h._id,
        name: h.name,
        category: h.category,
        totalCheckins: hCheckins.length,
        completedCheckins: hCheckins.filter(c => c.completed).length,
        successRate: hCheckins.length > 0 ? Math.round((hCheckins.filter(c => c.completed).length / hCheckins.length) * 100) : 0,
        currentStreak: h.currentStreak || 0,
      };
    });

    const bestHabits = habitStats.sort((a, b) => b.successRate - a.successRate).slice(0, 3);

    return res.json({
      summary: {
        totalHabits: habits.length,
        totalCheckins: checkins.length,
        totalCompleted: completedCheckins.length,
        overallSuccessRate: checkins.length > 0 ? Math.round((completedCheckins.length / checkins.length) * 100) : 0,
        recentActivity: recentCheckins.length,
      },
      categories: categories.sort((a, b) => b.successRate - a.successRate),
      bestHabits,
      streakLeaders: habitStats
        .filter(h => h.currentStreak > 0)
        .sort((a, b) => b.currentStreak - a.currentStreak)
        .slice(0, 3),
    });
  } catch (error) {
    return next(error);
  }
};
// User insights and analytics
export const getUserInsights = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const habits = await Habit.find({ user: userId });
    const habitIds = habits.map(h => h._id);

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
    if (bestDay && bestDay[1] > 0) {
      insights.push({
        type: "best_day",
        emoji: "🎯",
        text: `Ты чаще выполняешь привычки по ${bestDay[0]}`,
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
      const totalSkipped = checkins.filter((c) => !c.completed).length;
      const percentage = totalSkipped > 0 ? Math.round((topReason[1] / totalSkipped) * 100) : 0;
      insights.push({
        type: "skip_reason",
        emoji: "❌",
        text: `Основная причина пропусков — ${reasonLabels[topReason[0]]} (${percentage}%)`,
        value: topReason[1],
      });
    }

    // Insight 3: Best performing habit
    const habitStats = habits.map(h => {
      const hCheckins = checkins.filter(c => c.habit.equals(h._id));
      return {
        name: h.name,
        successRate: hCheckins.length > 0 ? Math.round((hCheckins.filter(c => c.completed).length / hCheckins.length) * 100) : 0,
      };
    });
    const bestHabit = habitStats.sort((a, b) => b.successRate - a.successRate)[0];
    if (bestHabit && bestHabit.successRate > 0) {
      insights.push({
        type: "best_habit",
        emoji: "⭐",
        text: `Твоя самая успешная привычка — "${bestHabit.name}" (${bestHabit.successRate}%)`,
        value: bestHabit.successRate,
      });
    }

    // Insight 4: Streak performance
    const habitsWithStreaks = habits.filter((h) => h.currentStreak > 0).sort((a, b) => b.currentStreak - a.currentStreak);
    if (habitsWithStreaks.length > 0) {
      insights.push({
        type: "best_streak",
        emoji: "🔥",
        text: `Твой лучший стрик: ${habitsWithStreaks[0].currentStreak} дней в "${habitsWithStreaks[0].name}"`,
        value: habitsWithStreaks[0].currentStreak,
      });
    }

    // Insight 5: Overall success rate
    const totalCompleted = checkins.filter((c) => c.completed).length;
    const overallRate = checkins.length > 0 ? Math.round((totalCompleted / checkins.length) * 100) : 0;
    insights.push({
      type: "overall_rate",
      emoji: "📊",
      text: `Твой процент выполнения: ${overallRate}%`,
      value: overallRate,
    });

    return res.json(insights);
  } catch (error) {
    return next(error);
  }
};

// Daily statistics - показывает статистику по дням
export const getDayStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const { Day } = await import("../models/Day.js");

    let query = { user: userId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    } else {
      // По умолчанию - последние 30 дней
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.date = { $gte: thirtyDaysAgo };
    }

    const days = await Day.find(query)
      .sort({ date: 1 })
      .populate("habits.habit");

    // Подготовка данных для графиков
    const dailyStats = days.map(day => ({
      date: day.date,
      completedHabits: day.habits.filter(h => h.completed).length,
      totalHabits: day.habits.length,
      successRate: day.totalHabits > 0 ? Math.round((day.completedHabits / day.totalHabits) * 100) : 0,
      mood: day.mood,
      energy: day.energy,
      dayNotes: day.dayNotes,
      status: day.status,
      tags: day.tags,
    }));

    // Расчет統計
    const completedDays = days.filter(d => d.completedHabits === d.totalHabits && d.totalHabits > 0).length;
    const totalDays = days.length;
    const avgHabitsPerDay = totalDays > 0 ? Math.round((days.reduce((sum, d) => sum + d.totalHabits, 0) / totalDays) * 10) / 10 : 0;
    const avgSuccessRate = totalDays > 0 ? Math.round(days.reduce((sum, d) => sum + (d.totalHabits > 0 ? d.completedHabits / d.totalHabits : 0), 0) / totalDays * 100) : 0;
    
    // Настроение и энергия
    const moods = days.filter(d => d.mood).map(d => d.mood);
    const energies = days.filter(d => d.energy).map(d => d.energy);
    const avgMood = moods.length > 0 ? Math.round((moods.reduce((sum, m) => sum + m, 0) / moods.length) * 10) / 10 : 0;
    const avgEnergy = energies.length > 0 ? Math.round((energies.reduce((sum, e) => sum + e, 0) / energies.length) * 10) / 10 : 0;

    // Лучший день
    const bestDay = days.reduce((best, day) => {
      const dayScore = day.totalHabits > 0 ? day.completedHabits / day.totalHabits : 0;
      const bestScore = best.totalHabits > 0 ? best.completedHabits / best.totalHabits : 0;
      return dayScore > bestScore ? day : best;
    }, days[0] || {});

    return res.json({
      summary: {
        totalDays,
        completedDays,
        avgHabitsPerDay,
        avgSuccessRate,
        avgMood,
        avgEnergy,
      },
      dailyStats,
      bestDay: bestDay._id ? {
        date: bestDay.date,
        completedHabits: bestDay.completedHabits,
        totalHabits: bestDay.totalHabits,
        successRate: bestDay.totalHabits > 0 ? Math.round((bestDay.completedHabits / bestDay.totalHabits) * 100) : 0,
      } : null,
    });
  } catch (error) {
    return next(error);
  }
};