import mongoose from "mongoose";

export const connectDatabase = async (mongoUri) => {
  if (!mongoUri) {
    throw new Error("MongoDB URI is missing. Set MONGODB_URI in .env.");
  }

  try {
    await mongoose.connect(mongoUri);
    // eslint-disable-next-line no-console
    console.log("✅ Connected to MongoDB Atlas");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};


