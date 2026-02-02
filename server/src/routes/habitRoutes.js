import express from "express";
import { body } from "express-validator";
import {
  createHabit,
  deleteHabit,
  getHabitById,
  getHabits,
  updateHabit,
} from "../controllers/habitController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

const habitValidationRules = [
  body("name").trim().notEmpty().withMessage("Habit name is required"),
  body("frequency")
    .optional()
    .isIn(["daily", "weekly", "custom"])
    .withMessage("Frequency must be daily, weekly, or custom"),
  body("category")
    .optional()
    .isIn([
      "health",
      "productivity",
      "learning",
      "mindfulness",
      "social",
      "other",
    ])
    .withMessage("Invalid category"),
];

router.post("/", authMiddleware, habitValidationRules, createHabit);
router.get("/", authMiddleware, getHabits);
router.get("/:id", authMiddleware, getHabitById);
router.put("/:id", authMiddleware, habitValidationRules, updateHabit);
router.delete("/:id", authMiddleware, deleteHabit);

export default router;


