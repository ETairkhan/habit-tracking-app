import express from "express";
import { body } from "express-validator";
import { authMiddleware } from "../middleware/auth.js";
import { getCheckinsForMonth, toggleCheckin } from "../controllers/checkinController.js";

const router = express.Router();

router.get("/", authMiddleware, getCheckinsForMonth);

router.post(
  "/toggle",
  authMiddleware,
  [
    body("habitId").notEmpty().withMessage("habitId is required"),
    body("date").notEmpty().withMessage("date is required"),
  ],
  toggleCheckin
);

export default router;
