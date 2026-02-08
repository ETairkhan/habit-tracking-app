import express from "express";
import {
  getAllUsers,
  getUsersWithHabits,
  makeAdmin,
  removeAdmin,
  deleteUser,
  deleteUserHabits,
} from "../controllers/adminController.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware, requireRole(["admin"]));

router.get("/users", getAllUsers);

router.get("/users-with-habits", getUsersWithHabits);

router.post("/make-admin", makeAdmin);

router.post("/remove-admin", removeAdmin);

router.delete("/users/:userId", deleteUser);

router.delete("/users/:userId/habits", deleteUserHabits);

export default router;
