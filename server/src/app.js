import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import habitRoutes from "./routes/habitRoutes.js";
import dayRoutes from "./routes/dayRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

export const createApp = () => {
  const app = express();

  // Простая и надежная CORS конфигурация
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Type"],
  }));

  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/api/health", (req, res) => {
    return res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/habits", habitRoutes);
  app.use("/api/days", dayRoutes);

  app.use(errorHandler);

  return app;
};
