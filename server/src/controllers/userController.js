import { validationResult } from "express-validator";
import { User } from "../models/User.js";

export const getCurrentUserProfile = async (req, res, next) => {
  try {
    const foundUser = await User.findById(req.user.id).select("-password");

    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(foundUser);
  } catch (error) {
    return next(error);
  }
};

export const updateCurrentUserProfile = async (req, res, next) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() });
  }

  const { email, username, displayName } = req.body;

  try {
    const foundUser = await User.findById(req.user.id);

    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email && email !== foundUser.email) {
      const existingEmailUser = await User.findOne({ email });
      if (existingEmailUser) {
        return res
          .status(400)
          .json({ message: "Another user already uses this email" });
      }
      foundUser.email = email;
    }

    if (username && username !== foundUser.username) {
      const existingUsernameUser = await User.findOne({ username });
      if (existingUsernameUser) {
        return res
          .status(400)
          .json({ message: "Another user already uses this username" });
      }
      foundUser.username = username;
    }

    if (displayName) {
      foundUser.displayName = displayName;
    }

    const savedUser = await foundUser.save();

    return res.json({
      id: savedUser._id,
      username: savedUser.username,
      email: savedUser.email,
      role: savedUser.role,
      displayName: savedUser.displayName,
      settings: savedUser.settings,
      stats: savedUser.stats,
    });
  } catch (error) {
    return next(error);
  }
};


