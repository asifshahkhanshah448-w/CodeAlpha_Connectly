import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: number;
  errors?: Record<string, { message: string }>;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  console.error('API Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found with the requested ID format.';
    error = new Error(message) as AppError;
    error.statusCode = 404;
  }

  // Mongoose duplicate key (code 11000)
  if (err.code === 11000) {
    const field = Object.keys((err as unknown as { keyPattern: Record<string, number> }).keyPattern || {})[0] || 'field';
    const message = `An account or record with that ${field} already exists.`;
    error = new Error(message) as AppError;
    error.statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError' && err.errors) {
    const messages = Object.values(err.errors).map((val) => val.message);
    const message = messages.join('. ');
    error = new Error(message) as AppError;
    error.statusCode = 400;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
  });
};
