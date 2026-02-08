import { User } from "../models/User.js";
import { Habit } from "../models/Habit.js";
import { sendTestEmail, sendWeeklyReport } from "../services/emailService.js";

export const sendTestNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await sendTestEmail(user.email, user.displayName || user.username);

    return res.json({
      message: "Test notification sent successfully",
      email: user.email,
    });
  } catch (error) {
    console.error("Error sending test notification:", error);
    return next(error);
  }
};

export const sendWeeklyPreview = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const habits = await Habit.find({ user: userId }).lean();

    if (habits.length === 0) {
      return res.json({
        message: "No habits to report. Create some habits first!",
        habitCount: 0,
      });
    }

    await sendWeeklyReport(
      user.email,
      user.displayName || user.username,
      habits
    );

    return res.json({
      message: "Weekly report sent successfully",
      habitCount: habits.length,
      email: user.email,
    });
  } catch (error) {
    console.error("Error sending weekly report:", error);
    return next(error);
  }
};
