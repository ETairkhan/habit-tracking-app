import { User } from "../models/User.js";
import { Habit } from "../models/Habit.js";
import { Checkin } from "../models/Checkin.js";
import { ROLES } from "../config/roles.js";

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").lean();

    return res.json({
      message: "Users retrieved successfully",
      count: users.length,
      users,
    });
  } catch (error) {
    return next(error);
  }
};

export const getUsersWithHabits = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").lean();

    const usersWithHabits = await Promise.all(
      users.map(async (user) => {
        const habits = await Habit.find({ user: user._id }).lean();
        return {
          ...user,
          habitCount: habits.length,
          habits: habits.map((h) => ({
            id: h._id,
            name: h.name,
            description: h.description,
            frequency: h.frequency,
            category: h.category,
            successRate: h.successRate,
            currentStreak: h.currentStreak,
            longestStreak: h.longestStreak,
            totalCompleted: h.totalCompleted,
            startDate: h.startDate,
            createdAt: h.createdAt,
            updatedAt: h.updatedAt,
          })),
        };
      })
    );

    return res.json({
      message: "Users with habits retrieved successfully",
      count: usersWithHabits.length,
      users: usersWithHabits,
    });
  } catch (error) {
    return next(error);
  }
};

export const makeAdmin = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const requestingUserId = req.user.id;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const requestingUser = await User.findById(requestingUserId);
    if (requestingUser.role !== ROLES.ADMIN) {
      return res
        .status(403)
        .json({ message: "Only admins can promote users" });
    }

    const userToPromote = await User.findById(userId);
    if (!userToPromote) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userToPromote.role === ROLES.ADMIN) {
      return res
        .status(400)
        .json({ message: "User is already an admin" });
    }

    userToPromote.role = "admin";
    await userToPromote.save();

    return res.json({
      message: `User ${userToPromote.username} has been promoted to admin`,
      user: {
        id: userToPromote._id,
        username: userToPromote.username,
        email: userToPromote.email,
        role: userToPromote.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const removeAdmin = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const requestingUserId = req.user.id;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const requestingUser = await User.findById(requestingUserId);
    if (requestingUser.role !== ROLES.ADMIN) {
      return res
        .status(403)
        .json({ message: "Only admins can change user roles" });
    }

    const userToDowngrade = await User.findById(userId);
    if (!userToDowngrade) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userToDowngrade.role !== ROLES.ADMIN) {
      return res
        .status(400)
        .json({ message: "User is not an admin" });
    }

    userToDowngrade.role = ROLES.USER;
    await userToDowngrade.save();

    return res.json({
      message: `User ${userToDowngrade.username} has been downgraded from admin`,
      user: {
        id: userToDowngrade._id,
        username: userToDowngrade.username,
        email: userToDowngrade.email,
        role: userToDowngrade.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    const habits = await Habit.find({ user: userId });
    const habitIds = habits.map((h) => h._id);

    if (habitIds.length > 0) {
      await Checkin.deleteMany({ habit: { $in: habitIds } });
      await Habit.deleteMany({ user: userId });
    }

    await User.findByIdAndDelete(userId);

    return res.json({
      message: `User ${userToDelete.username} and all associated data deleted successfully`,
      deletedUser: {
        id: userToDelete._id,
        username: userToDelete.username,
        email: userToDelete.email,
      },
      deletedHabits: habitIds.length,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteUserHabits = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const habits = await Habit.find({ user: userId });
    const habitIds = habits.map((h) => h._id);

    if (habitIds.length > 0) {
      await Checkin.deleteMany({ habit: { $in: habitIds } });
      await Habit.deleteMany({ user: userId });
    }

    return res.json({
      message: `All habits for user ${user.username} deleted successfully`,
      deletedHabits: habitIds.length,
      habitsIds: habitIds,
    });
  } catch (error) {
    return next(error);
  }
};

/** Set a user's role. Admin only. Cannot demote the last admin. */
export const setUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        message: "userId and role are required. Valid roles: user, premium, moderator, admin",
      });
    }

    const validRoles = Object.values(ROLES);
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const adminCount = await User.countDocuments({ role: ROLES.ADMIN });
    if (
      targetUser.role === ROLES.ADMIN &&
      role !== ROLES.ADMIN &&
      adminCount <= 1
    ) {
      return res.status(400).json({
        message: "Cannot demote the last admin",
      });
    }

    targetUser.role = role;
    await targetUser.save();

    return res.json({
      message: `User ${targetUser.username} role updated to ${role}`,
      user: {
        id: targetUser._id,
        username: targetUser.username,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};
