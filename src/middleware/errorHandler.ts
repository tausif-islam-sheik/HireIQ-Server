import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";
import { Sentry } from "../lib/sentry";

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  logger.error(`[${statusCode}] ${message}`, {
    stack: err.stack,
    isOperational: err.isOperational,
  });

  // Capture error in Sentry (skip operational errors like 400, 404)
  if (process.env.SENTRY_DSN && (!err.isOperational || statusCode >= 500)) {
    Sentry.captureException(err);
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? "Internal server error" : message,
    data: null,
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    data: null,
  });
};

export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
