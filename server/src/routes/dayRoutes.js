import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  createDay,
  getUserDays,
  getDayById,
  updateDay,
  addHabitToDay,
  removeHabitFromDay,
  checkHabitInDay,
  deleteDay,
  getMonthlyDays,
} from "../controllers/dayController.js";

const router = express.Router();

// Применить middleware аутентификации ко всем маршрутам
router.use(authMiddleware);

// Получить месячный календарь (напишите перед GET /)
router.get("/calendar", getMonthlyDays);

// Создать новый день
router.post("/", createDay);

// Получить дни пользователя
router.get("/", getUserDays);

// Получить день по ID
router.get("/:dayId", getDayById);

// Обновить день
router.put("/:dayId", updateDay);

// Добавить привычку к дню
router.post("/:dayId/habits", addHabitToDay);

// Удалить привычку из дня
router.delete("/:dayId/habits/:habitId", removeHabitFromDay);

// Отметить привычку как выполненную
router.put("/:dayId/habits/:habitId", checkHabitInDay);

// Удалить день
router.delete("/:dayId", deleteDay);

export default router;
