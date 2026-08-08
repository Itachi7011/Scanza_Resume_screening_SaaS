import bcrypt from "bcryptjs";
import { AccountRole, AccountStatus, OtpPurpose , Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { AppError } from "../utils/AppError";
import { issueOtp } from "./otp.service";

const PASSWORD_SALT_ROUNDS = 12;

export async function registerAccount(params: {
  fullName: string;
  email: string;
  password: string;
  companyName?: string;
}) {
  const existing = await prisma.account.findUnique({ where: { email: params.email } });
  if (existing) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(params.password, PASSWORD_SALT_ROUNDS);

  // If a companyName is supplied, this signup creates a new SaaS Client
  // workspace and the account becomes its CLIENT_OWNER. Otherwise it's a
  // regular END_USER signing up to use scanza.dev directly.
  const account = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    let clientId: string | undefined;

    if (params.companyName) {
      const client = await tx.client.create({
        data: { companyName: params.companyName },
      });
      clientId = client.id;
    }

    return tx.account.create({
      data: {
        fullName: params.fullName,
        email: params.email,
        passwordHash,
        role: params.companyName ? AccountRole.CLIENT_OWNER : AccountRole.END_USER,
        status: AccountStatus.PENDING_VERIFICATION,
        clientId,
      },
    });
  });

  await issueOtp(account.id, account.email, OtpPurpose.EMAIL_VERIFICATION);

  return account;
}

export async function verifyEmailWithOtp(accountId: string) {
  const account = await prisma.account.update({
    where: { id: accountId },
    data: { isEmailVerified: true, status: AccountStatus.ACTIVE },
  });
  return account;
}

export async function validateCredentials(email: string, password: string) {
  const account = await prisma.account.findUnique({ where: { email } });
  if (!account) throw new AppError("Invalid email or password.", 401);

  const isValid = await bcrypt.compare(password, account.passwordHash);
  if (!isValid) throw new AppError("Invalid email or password.", 401);

  if (account.status === AccountStatus.BLOCKED) {
    throw new AppError("This account has been blocked. Contact support if you believe this is a mistake.", 403);
  }
  if (account.status === AccountStatus.DELETED) {
    throw new AppError("This account no longer exists.", 403);
  }
  if (account.status === AccountStatus.PENDING_VERIFICATION) {
    throw new AppError("Please verify your email before logging in.", 403);
  }

  return account;
}

export async function changePassword(accountId: string, currentPassword: string, newPassword: string) {
  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  const isValid = await bcrypt.compare(currentPassword, account.passwordHash);
  if (!isValid) throw new AppError("Current password is incorrect.", 400);

  const passwordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
  await prisma.account.update({ where: { id: accountId }, data: { passwordHash } });
}

export async function resetPasswordWithOtp(accountId: string, newPassword: string) {
  const passwordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
  await prisma.account.update({ where: { id: accountId }, data: { passwordHash } });
}

export async function findAccountByEmail(email: string) {
  return prisma.account.findUnique({ where: { email } });
}

export async function getPublicProfile(accountId: string) {
  const account = await prisma.account.findUniqueOrThrow({
    where: { id: accountId },
    select: {
      id: true,
      fullName: true,
      email: true,
      avatarUrl: true,
      role: true,
      status: true,
      isEmailVerified: true,
      preferredTheme: true,
      clientId: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
  return account;
}
