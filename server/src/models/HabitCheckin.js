import mongoose from "mongoose";

const habitCheckinSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    habit: { type: mongoose.Schema.Types.ObjectId, ref: "Habit", required: true },
    // Храним дату как YYYY-MM-DD строку, чтобы легко сравнивать и фильтровать
    date: { type: String, required: true },
    completed: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// один чек-ин на 1 привычку в 1 день у 1 пользователя
habitCheckinSchema.index({ user: 1, habit: 1, date: 1 }, { unique: true });

export const HabitCheckin = mongoose.model("HabitCheckin", habitCheckinSchema);
