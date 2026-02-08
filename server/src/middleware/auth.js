import jwt from "jsonwebtoken";
import { canManageAnyHabit } from "../config/roles.js";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decodedToken.id, role: decodedToken.role };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }

    return next();
  };
};

/**
 * Helper: returns true if the current user can manage any habit (admin/moderator).
 * Regular users can only manage their own habits.
 */
export const userCanManageAnyHabit = (req) =>
  req.user && canManageAnyHabit(req.user.role);


