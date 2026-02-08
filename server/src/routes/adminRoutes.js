import express from "express";
import {
  getAllUsers,
  getUsersWithHabits,
  makeAdmin,
  removeAdmin,
  deleteUser,
  deleteUserHabits,
  setUserRole,
} from "../controllers/adminController.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { ADMIN_VIEW_ROLES, ADMIN_FULL_ROLES } from "../config/roles.js";

const router = express.Router();

// All admin routes require authentication
router.use(authMiddleware);

// Admin view routes: admin + moderator can view users and habits
router.get("/users", requireRole(ADMIN_VIEW_ROLES), getAllUsers);
router.get("/users-with-habits", requireRole(ADMIN_VIEW_ROLES), getUsersWithHabits);

// Admin-only routes: delete users, promote/demote roles, set any role
router.post("/make-admin", requireRole(ADMIN_FULL_ROLES), makeAdmin);
router.post("/remove-admin", requireRole(ADMIN_FULL_ROLES), removeAdmin);
router.put("/users/:userId/role", requireRole(ADMIN_FULL_ROLES), setUserRole);
router.delete("/users/:userId", requireRole(ADMIN_FULL_ROLES), deleteUser);
router.delete("/users/:userId/habits", requireRole(ADMIN_FULL_ROLES), deleteUserHabits);

export default router;
