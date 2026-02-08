import { validationResult } from "express-validator";
import { Habit } from "../models/Habit.js";
import { userCanManageAnyHabit } from "../middleware/auth.js";

export const createHabit = async (req, res, next) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() });
  }

  try {
    const createdHabit = await Habit.create({
      ...req.body,
      user: req.user.id,
    });

    return res.status(201).json(createdHabit);
  } catch (error) {
    return next(error);
  }
};

export const getHabits = async (req, res, next) => {
  try {
    const habits = await Habit.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    return res.json(habits);
  } catch (error) {
    return next(error);
  }
};

export const getHabitById = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (!userCanManageAnyHabit(req)) {
      query.user = req.user.id;
    }
    const habit = await Habit.findOne(query);

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    return res.json(habit);
  } catch (error) {
    return next(error);
  }
};

export const updateHabit = async (req, res, next) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() });
  }

  try {
    const query = { _id: req.params.id };
    if (!userCanManageAnyHabit(req)) {
      query.user = req.user.id;
    }
    const habit = await Habit.findOne(query);

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    Object.assign(habit, req.body);

    const updatedHabit = await habit.save();

    return res.json(updatedHabit);
  } catch (error) {
    return next(error);
  }
};

export const deleteHabit = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (!userCanManageAnyHabit(req)) {
      query.user = req.user.id;
    }
    const habit = await Habit.findOneAndDelete(query);

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};


