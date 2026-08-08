import crypto from "crypto";
import bcrypt from "bcryptjs";
import { OtpPurpose } from "@prisma/client";
import { prisma } from "../config/database";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { sendEmail, otpEmailTemplate } from "./email.service";

function generateNumericCode(length = 6): string {
  // crypto-secure random digits, not Math.random()
  const max = 10 ** length;
  const num = crypto.randomInt(0, max);
  return num.toString().padStart(length, "0");
}

export async function issueOtp(accountId: string, email: string, purpose: OtpPurpose) {
  const code = generateNumericCode(6);
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate any previous un-consumed OTPs of the same purpose first.
  await prisma.otpToken.updateMany({
    where: { accountId, purpose, consumed: false },
    data: { consumed: true },
  });

  await prisma.otpToken.create({
    data: { accountId, purpose, codeHash, expiresAt },
  });

  const template = otpEmailTemplate(code, purpose.replace(/_/g, " ").toLowerCase());
  await sendEmail({ to: email, ...template });

  return { expiresAt };
}

export async function verifyOtp(accountId: string, purpose: OtpPurpose, submittedCode: string) {
  const otp = await prisma.otpToken.findFirst({
    where: { accountId, purpose, consumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) throw new AppError("No active verification code found. Please request a new one.", 400);
  if (otp.expiresAt < new Date()) throw new AppError("This code has expired. Please request a new one.", 400);
  if (otp.attempts >= env.OTP_MAX_ATTEMPTS) {
    throw new AppError("Too many incorrect attempts. Please request a new code.", 429);
  }

  const isValid = await bcrypt.compare(submittedCode, otp.codeHash);

  if (!isValid) {
    await prisma.otpToken.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    throw new AppError("Incorrect verification code.", 400);
  }

  await prisma.otpToken.update({
    where: { id: otp.id },
    data: { consumed: true },
  });

  return true;
}
