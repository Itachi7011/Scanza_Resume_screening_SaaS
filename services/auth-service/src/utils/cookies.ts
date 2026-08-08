import { Response } from "express";
import { env, isProd } from "../config/env";

const baseCookieOptions = {
  httpOnly: true,
  secure: isProd, // requires HTTPS in production
  sameSite: "lax" as const,
  domain: isProd ? env.COOKIE_DOMAIN : undefined,
  path: "/",
};

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie("scanza_access_token", accessToken, {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes, mirrors JWT_ACCESS_EXPIRES_IN default
  });
  res.cookie("scanza_refresh_token", refreshToken, {
    ...baseCookieOptions,
    maxAge: env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie("scanza_access_token", baseCookieOptions);
  res.clearCookie("scanza_refresh_token", baseCookieOptions);
}
