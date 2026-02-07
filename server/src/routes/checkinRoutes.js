import express from "express";
import { body } from "express-validator";
import {
  createCheckin,
  getHabitStats,
  updateCheckin,
  deleteCheckin,
  getCheckinsByDateRange,
  getHeatmapData,
  getProgressTrend,
  getStreakDetails,
} from "../controllers/checkinController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router({ mergeParams: true });

// POST /api/habits/:habitId/checkins - создать чекин (отметить привычку выполненной)
router.post(
  "/",
  authMiddleware,
  [
    body("date")
      .optional()
      .isISO8601()
      .withMessage("Date must be valid ISO8601"),
    body("completed")
      .optional()
      .isBoolean()
      .withMessage("Completed must be boolean"),
    body("notes")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("Notes must be less than 500 characters"),
    body("skipReason")
      .optional()
      .isIn(["no-time", "tired", "forgot", "no-motivation", "other"])
      .withMessage("Invalid skip reason"),
    body("quality")
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage("Quality must be between 1 and 5"),
  ],
  createCheckin
);

// GET /api/habits/:habitId/checkins/stats - получить статистику привычки
router.get("/stats", authMiddleware, getHabitStats);

// GET /api/habits/:habitId/checkins/heatmap - получить данные календаря
router.get("/heatmap", authMiddleware, getHeatmapData);

// GET /api/habits/:habitId/checkins/streak - получить информацию о стриках
router.get("/streak", authMiddleware, getStreakDetails);

// GET /api/habits/:habitId/checkins/trend - получить тренд прогресса
router.get("/trend", authMiddleware, getProgressTrend);

// GET /api/habits/:habitId/checkins - получить чекины за диапазон дат
router.get("/", authMiddleware, getCheckinsByDateRange);

// PUT /api/habits/:habitId/checkins/:checkinId - обновить чекин
router.put(
  "/:checkinId",
  authMiddleware,
  [
    body("completed")
      .optional()
      .isBoolean()
      .withMessage("Completed must be boolean"),
    body("notes")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("Notes must be less than 500 characters"),
  ],
  updateCheckin
);

// DELETE /api/habits/:habitId/checkins/:checkinId - удалить чекин
router.delete("/:checkinId", authMiddleware, deleteCheckin);

export default router;
