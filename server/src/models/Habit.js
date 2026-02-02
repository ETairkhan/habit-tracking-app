import mongoose from "mongoose";

const habitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    category: {
      type: String,
      enum: [
        "health",
        "productivity",
        "learning",
        "mindfulness",
        "social",
        "other",
      ],
      default: "other",
    },
    colorCode: { type: String, default: "#4CAF50" },
    icon: { type: String, default: "default-icon" },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "custom"],
      default: "daily",
    },
    daysOfWeek: [
      {
        type: String,
        enum: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      },
    ],
    targetValue: { type: Number },
    unit: { type: String },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalCompleted: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
  },
  { timestamps: true }
);

export const Habit = mongoose.model("Habit", habitSchema);


