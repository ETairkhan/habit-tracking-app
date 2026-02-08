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
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .custom((value) => {
        // Check if password contains any whitespace
        if (/\s/.test(value)) {
          throw new Error("Password cannot contain any whitespace characters");
        }
        // Check for at least one uppercase letter, one lowercase letter, and one number
        if (!/(?=.*[a-z])/.test(value)) {
          throw new Error("Password must contain at least one lowercase letter");
        }
        if (!/(?=.*[A-Z])/.test(value)) {
          throw new Error("Password must contain at least one uppercase letter");
        }
        if (!/(?=.*\d)/.test(value)) {
          throw new Error("Password must contain at least one number");
        }
        return true;
      }),
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
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .custom((value) => {
        // Check if password contains any whitespace
        if (/\s/.test(value)) {
          throw new Error("Password cannot contain any whitespace characters");
        }
        return true;
      }),
  ],
  loginUser
);

export default router;


