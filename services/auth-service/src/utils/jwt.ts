import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { AccountRole } from "@prisma/client";

export interface AccessTokenPayload {
  sub: string; // accountId
  role: AccountRole;
  clientId?: string | null;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    // @types/jsonwebtoken types `expiresIn` as a branded string-template type
    // (from the `ms` package), not a plain `string` — our value comes from a
    // zod-validated env var, which TS correctly can't narrow to that literal
    // union at compile time. Runtime behavior is unaffected either way; jwt
    // itself accepts any valid "ms"-style string ("15m", "7d", etc.).
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
    issuer: "scanza-auth-service",
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: "scanza-auth-service",
  }) as AccessTokenPayload;
}

/**
 * Refresh tokens are opaque random JWTs whose ONLY payload is the account id
 * + a random jti. The actual session validity is tracked in the database
 * (RefreshToken table, stored as a SHA-256 hash) so a single token can be
 * revoked instantly (logout, password change, admin block) without waiting
 * for expiry — a plain stateless JWT can't do that.
 */
export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.JWT_REFRESH_EXPIRES_IN_DAYS}d` as SignOptions["expiresIn"],
    issuer: "scanza-auth-service",
  });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: "scanza-auth-service",
  }) as RefreshTokenPayload;
}