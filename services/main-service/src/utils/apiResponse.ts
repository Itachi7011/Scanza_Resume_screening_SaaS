import { Response } from "express";

/**
 * Every response from every Scanza service follows this exact shape, so the
 * Next.js frontend can use one shared response type for all API calls.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  errors?: unknown
) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: errors ?? null,
  });
}
