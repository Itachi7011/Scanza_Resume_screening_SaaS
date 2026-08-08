import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { AccountRole } from "@prisma/client";
import { env } from "../config/env";
import { sendError } from "../utils/apiResponse";

interface AccessTokenPayload {
  sub: string;
  role: AccountRole;
  clientId?: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      account?: { id: string; role: AccountRole; clientId?: string | null };
      apiClient?: { clientId: string; apiKeyId: string };
    }
  }
}

/**
 * Verifies the same JWT that auth-service issued. main-service does NOT
 * call auth-service over HTTP to check sessions — that would add a network
 * hop + latency + a single point of failure to every protected request.
 * Instead both services independently verify with the shared secret
 * (standard stateless-JWT microservice pattern).
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : undefined;
  const token = bearer || req.cookies?.scanza_access_token;

  if (!token) return sendError(res, "Authentication required.", 401);

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: "scanza-auth-service",
    }) as AccessTokenPayload;
    req.account = { id: payload.sub, role: payload.role, clientId: payload.clientId };
    next();
  } catch {
    return sendError(res, "Invalid or expired session.", 401);
  }
}

/** Like authenticate(), but doesn't fail the request if no token is present
 * — used on the public homepage upload endpoint, which works for both
 * logged-in users (resume gets saved to their account) and anonymous
 * visitors (resume is analyzed but not persisted to an account). */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : undefined;
  const token = bearer || req.cookies?.scanza_access_token;
  if (!token) return next();

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: "scanza-auth-service",
    }) as AccessTokenPayload;
    req.account = { id: payload.sub, role: payload.role, clientId: payload.clientId };
  } catch {
    // Invalid/expired token on an optional route — just proceed as anonymous.
  }
  next();
}

export function requireRole(...roles: AccountRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.account) return sendError(res, "Authentication required.", 401);
    if (!roles.includes(req.account.role)) {
      return sendError(res, "You do not have permission to perform this action.", 403);
    }
    next();
  };
}
