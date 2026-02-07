import express from "express";
import { body } from "express-validator";
import {
  getCurrentUserProfile,
  updateCurrentUserProfile,
  getUserStats,
  getCategoryStats,
  getWeeklyStats,
  getDashboardStats,
  getUserInsights,
  getDayStats,
} from "../controllers/userController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/profile", authMiddleware, getCurrentUserProfile);

router.put(
  "/profile",
  authMiddleware,
  [
    body("email").optional().isEmail().withMessage("Email must be valid"),
    body("username")
      .optional()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long"),
    body("displayName")
      .optional()
      .isLength({ min: 2 })
      .withMessage("Display name must be at least 2 characters long"),
  ],
  updateCurrentUserProfile
);

router.get("/stats", authMiddleware, getUserStats);
router.get("/stats/dashboard", authMiddleware, getDashboardStats);
router.get("/stats/weekly", authMiddleware, getWeeklyStats);
router.get("/stats/days", authMiddleware, getDayStats);
router.get("/stats/category/:category", authMiddleware, getCategoryStats);
router.get("/insights", authMiddleware, getUserInsights);

export default router;