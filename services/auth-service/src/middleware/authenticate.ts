import { Request, Response, NextFunction } from "express";
import { AccountRole } from "@prisma/client";
import { verifyAccessToken } from "../utils/jwt";
import { sendError } from "../utils/apiResponse";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      account?: {
        id: string;
        role: AccountRole;
        clientId?: string | null;
      };
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : undefined;
  const token = bearer || req.cookies?.scanza_access_token;

  if (!token) return sendError(res, "Authentication required.", 401);

  try {
    const payload = verifyAccessToken(token);
    req.account = { id: payload.sub, role: payload.role, clientId: payload.clientId };
    next();
  } catch {
    return sendError(res, "Invalid or expired session.", 401);
  }
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
