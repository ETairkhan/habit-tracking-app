import express from "express";
import {
  sendTestNotification,
  sendWeeklyPreview,
} from "../controllers/notificationController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/test", authMiddleware, sendTestNotification);
router.post("/weekly-preview", authMiddleware, sendWeeklyPreview);

export default router;
