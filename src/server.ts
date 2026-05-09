import "dotenv/config";
import { initSentry, Sentry } from "./lib/sentry";
initSentry();
import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { logger, morganStream } from "./lib/logger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { globalLimiter } from "./middleware/rateLimit.middleware";
import { initializeSocket } from "./socket/socket";
import { createResumeWorker } from "./queues/resumeQueue";
import { createEmailWorker } from "./queues/emailQueue";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import jobRoutes from "./routes/job.routes";
import applicationRoutes from "./routes/application.routes";
import companyRoutes from "./routes/company.routes";
import resumeRoutes from "./routes/resume.routes";
import aiRoutes from "./routes/ai.routes";
import savedJobRoutes from "./routes/savedJob.routes";
import notificationRoutes from "./routes/notification.routes";

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initializeSocket(httpServer);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting
app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// HTTP request logging
app.use(morgan("combined", { stream: morganStream }));

// Health check
app.get("/api/v1/health", (_req, res) => {
  res.json({
    success: true,
    message: "HireIQ API is running",
    data: {
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    },
  });
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/applications", applicationRoutes);
app.use("/api/v1/companies", companyRoutes);
app.use("/api/v1/resumes", resumeRoutes);
app.use("/api/v1/saved-jobs", savedJobRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/notifications", notificationRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Sentry error handler (must be after all other error handlers)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// Initialize BullMQ workers
let resumeWorker: ReturnType<typeof createResumeWorker> | null = null;
let emailWorker: ReturnType<typeof createEmailWorker> | null = null;

const initializeWorkers = (): void => {
  try {
    resumeWorker = createResumeWorker();
    emailWorker = createEmailWorker();
    logger.info("BullMQ workers initialized");
  } catch (error) {
    logger.warn("BullMQ workers failed to initialize (Redis may not be available):", error);
  }
};

// Start server
const PORT = parseInt(process.env.PORT || "5000", 10);

httpServer.listen(PORT, () => {
  logger.info(`HireIQ server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`API Base URL: http://localhost:${PORT}/api/v1`);

  // Initialize workers after server starts
  initializeWorkers();
});

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  httpServer.close(() => {
    logger.info("HTTP server closed");
  });

  if (resumeWorker) {
    await resumeWorker.close();
    logger.info("Resume worker closed");
  }

  if (emailWorker) {
    await emailWorker.close();
    logger.info("Email worker closed");
  }

  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (reason: unknown) => {
  logger.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error);
  }
  process.exit(1);
});

export default app;
