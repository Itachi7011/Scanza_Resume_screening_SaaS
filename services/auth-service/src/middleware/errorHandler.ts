import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { sendError } from "../utils/apiResponse";
import { logger } from "../utils/logger";
import { isProd } from "../config/env";

export function notFoundHandler(req: Request, res: Response) {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  const error = err as Error;
  logger.error("Unhandled error", { message: error.message, stack: error.stack });

  return sendError(
    res,
    isProd ? "Something went wrong. Please try again." : error.message,
    500
  );
}
