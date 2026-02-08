import mongoose from "mongoose";

const userSettingsSchema = new mongoose.Schema(
  {
    emailNotifications: { type: Boolean, default: true },
    timezone: { type: String, default: "UTC" },
    dailyReminderTime: { type: String, default: "09:00" },
    weekStartsOn: {
      type: String,
      enum: ["monday", "sunday"],
      default: "monday",
    },
  },
  { _id: false }
);

const userStatsSchema = new mongoose.Schema(
  {
    totalHabits: { type: Number, default: 0 },
    totalCheckins: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 },
    totalXP: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    nextLevelXP: { type: Number, default: 100 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    displayName: { type: String },
    avatar: { type: String, default: "default-avatar.png" },
    role: {
      type: String,
      enum: ["user", "premium", "moderator", "admin"],
      default: "user",
    },
    settings: { type: userSettingsSchema, default: () => ({}) },
    stats: { type: userStatsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);


