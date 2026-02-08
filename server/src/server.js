import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";

dotenv.config();

const startServer = async () => {
  try {
    await connectDatabase(process.env.MONGODB_URI);

    const app = createApp();
    const port = process.env.PORT || 5001;

    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`✅ Server listening on port ${port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();


