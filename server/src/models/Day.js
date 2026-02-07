import mongoose from "mongoose";

const daySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    // Привычки, запланированные на этот день
    habits: [
      {
        habit: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Habit",
          required: true,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        quality: {
          type: Number,
          min: 1,
          max: 5,
          default: null,
        },
        notes: String,
        checkedAt: Date,
      },
    ],
    // Общие заметки за день
    dayNotes: {
      type: String,
      maxlength: 1000,
    },
    // Настроение за день (1-5)
    mood: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    // Энергия (1-5)
    energy: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    // Статистика за день
    totalHabits: {
      type: Number,
      default: 0,
    },
    completedHabits: {
      type: Number,
      default: 0,
    },
    daySuccessRate: {
      type: Number,
      default: 0,
    },
    // Теги/категории для дня (напр., #работа #спорт)
    tags: [String],
    // Статус дня
    status: {
      type: String,
      enum: ["planned", "in-progress", "completed", "skipped"],
      default: "planned",
    },
  },
  { timestamps: true }
);

// Уникальный индекс: один день в один день для одного пользователя
daySchema.index({ user: 1, date: 1 }, { unique: true });
daySchema.index({ user: 1, status: 1 });

export const Day = mongoose.model("Day", daySchema);
