import { Request, Response, NextFunction } from 'express';

/**
 * Custom application error with HTTP status code support.
 */
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

/**
 * Global error handling middleware.
 * Catches all errors thrown in route handlers and returns
 * a consistent JSON error response.
 */
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(`[Error] ${err.name}: ${err.message}`);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  // Prisma known request errors
  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(400).json({
      error: 'Database operation failed. Please check your input.',
    });
    return;
  }

  // Validation errors from express-validator
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: err.message,
    });
    return;
  }

  // Default: 500 Internal Server Error
  res.status(500).json({
    error: 'An unexpected error occurred.',
  });
};
