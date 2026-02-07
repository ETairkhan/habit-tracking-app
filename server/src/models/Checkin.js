import mongoose from "mongoose";

const checkinSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    habit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Habit",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: () => new Date(new Date().toDateString()),
    },
    completed: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    // Причина пропуска (если completed = false)
    skipReason: {
      type: String,
      enum: ["no-time", "tired", "forgot", "no-motivation", "other", null],
      default: null,
    },
    // Дополнительный текст для причины "other"
    skipReasonText: {
      type: String,
      maxlength: 200,
    },
    // Качество выполнения (1-5) если completed = true
    quality: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
  },
  { timestamps: true }
);

// Index для быстрого поиска по пользователю и привычке
checkinSchema.index({ user: 1, habit: 1 });
checkinSchema.index({ user: 1, date: 1 });
checkinSchema.index({ habit: 1, date: 1 });
checkinSchema.index({ user: 1, completed: 1 });

export const Checkin = mongoose.model("Checkin", checkinSchema);
