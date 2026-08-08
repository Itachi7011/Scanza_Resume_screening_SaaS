import { Request, Response } from "express";
import { AccountRole, OtpPurpose } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";
import { setAuthCookies, clearAuthCookies } from "../utils/cookies";
import * as authService from "../services/auth.service";
import * as otpService from "../services/otp.service";
import * as tokenService from "../services/token.service";
import * as inviteService from "../services/invite.service";
import { prisma } from "../config/database";

function requestMeta(req: Request) {
  return { userAgent: req.headers["user-agent"], ipAddress: req.ip };
}

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, password, companyName } = req.body;
  const account = await authService.registerAccount({ fullName, email, password, companyName });

  return sendSuccess(
    res,
    { accountId: account.id, email: account.email },
    "Account created. Check your email for a verification code.",
    201
  );
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { accountId, code } = req.body;
  await otpService.verifyOtp(accountId, OtpPurpose.EMAIL_VERIFICATION, code);
  const account = await authService.verifyEmailWithOtp(accountId);

  const { accessToken, refreshToken } = await tokenService.issueTokenPair(account, requestMeta(req));
  setAuthCookies(res, accessToken, refreshToken);

  return sendSuccess(res, { accessToken, profile: await authService.getPublicProfile(account.id) }, "Email verified successfully.");
});

export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { accountId } = req.body;
  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  await otpService.issueOtp(account.id, account.email, OtpPurpose.EMAIL_VERIFICATION);
  return sendSuccess(res, null, "A new verification code has been sent.");
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const account = await authService.validateCredentials(email, password);

  const { accessToken, refreshToken } = await tokenService.issueTokenPair(account, requestMeta(req));
  setAuthCookies(res, accessToken, refreshToken);

  await prisma.account.update({ where: { id: account.id }, data: { lastLoginAt: new Date() } });

  return sendSuccess(res, { accessToken, profile: await authService.getPublicProfile(account.id) }, "Logged in successfully.");
});

/** Same logic as login, but rejects anyone who isn't ADMIN/SUPER_ADMIN — used by the admin panel's login page. */
export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const account = await authService.validateCredentials(email, password);

  if (account.role !== AccountRole.ADMIN && account.role !== AccountRole.SUPER_ADMIN) {
    throw new AppError("This login is restricted to administrators.", 403);
  }

  const { accessToken, refreshToken } = await tokenService.issueTokenPair(account, requestMeta(req));
  setAuthCookies(res, accessToken, refreshToken);
  await prisma.account.update({ where: { id: account.id }, data: { lastLoginAt: new Date() } });

  return sendSuccess(res, { accessToken, profile: await authService.getPublicProfile(account.id) }, "Admin login successful.");
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = req.cookies?.scanza_refresh_token;
  if (!rawToken) throw new AppError("No active session found.", 401);

  const { accessToken, refreshToken } = await tokenService.rotateRefreshToken(rawToken, requestMeta(req));
  setAuthCookies(res, accessToken, refreshToken);

  return sendSuccess(res, { accessToken }, "Session refreshed.");
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = req.cookies?.scanza_refresh_token;
  if (rawToken) await tokenService.revokeRefreshToken(rawToken);
  clearAuthCookies(res);
  return sendSuccess(res, null, "Logged out successfully.");
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const account = await authService.findAccountByEmail(email);

  // Always respond with success, even if the account doesn't exist — this
  // prevents attackers from using this endpoint to enumerate valid emails.
  if (account) {
    await otpService.issueOtp(account.id, account.email, OtpPurpose.PASSWORD_RESET);
  }

  return sendSuccess(
    res,
    account ? { accountId: account.id } : null,
    "If an account with that email exists, a reset code has been sent."
  );
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { accountId, code, newPassword } = req.body;
  await otpService.verifyOtp(accountId, OtpPurpose.PASSWORD_RESET, code);
  await authService.resetPasswordWithOtp(accountId, newPassword);
  await tokenService.revokeAllTokensForAccount(accountId); // force re-login everywhere

  return sendSuccess(res, null, "Password reset successfully. Please log in with your new password.");
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const accountId = req.account!.id;
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(accountId, currentPassword, newPassword);
  return sendSuccess(res, null, "Password changed successfully.");
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const profile = await authService.getPublicProfile(req.account!.id);
  return sendSuccess(res, profile, "Profile fetched.");
});

export const acceptInvite = asyncHandler(async (req: Request, res: Response) => {
  const { inviteId, token, fullName, password } = req.body;
  const account = await inviteService.acceptTeamInvite(inviteId, token, fullName, password);

  const { accessToken, refreshToken } = await tokenService.issueTokenPair(account, requestMeta(req));
  setAuthCookies(res, accessToken, refreshToken);

  return sendSuccess(res, { accessToken, profile: await authService.getPublicProfile(account.id) }, "Invite accepted — welcome aboard.");
});
