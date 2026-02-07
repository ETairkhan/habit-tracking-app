import express from "express";
import { body } from "express-validator";
import { loginUser, registerUser } from "../controllers/authController.js";

const router = express.Router();

router.post(
  "/register",
  [
    body("username").trim().notEmpty().withMessage("Username is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  registerUser
);

router.post(
  "/login",
  [
    body("emailOrUsername")
      .trim()
      .notEmpty()
      .withMessage("Email or username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  loginUser
);

export default router;


