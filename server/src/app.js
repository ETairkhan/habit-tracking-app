import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import habitRoutes from "./routes/habitRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import checkinRoutes from "./routes/checkinRoutes.js"; 
dotenv.config();

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/api/health", (req, res) => {
    return res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/habits", habitRoutes);
  app.use("/api/checkins", checkinRoutes);

  app.use(errorHandler);
  

  return app;
};


