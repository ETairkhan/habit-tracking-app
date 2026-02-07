// Global error handling middleware
// Use next(error) in controllers/services to reach here
// Ensure consistent error responses for the client

// eslint-disable-next-line no-unused-vars
export const errorHandler = (error, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error("Error:", error);

  const statusCode = error.statusCode || 500;
  const message =
    error.message || "Something went wrong. Please try again later.";

  return res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};


