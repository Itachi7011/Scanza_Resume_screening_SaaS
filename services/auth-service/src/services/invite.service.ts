import bcrypt from "bcryptjs";
import { TeamInviteStatus, AccountStatus } from "@prisma/client";
import { prisma } from "../config/database";
import { AppError } from "../utils/AppError";

const PASSWORD_SALT_ROUNDS = 12;

/**
 * Accepting a team invite is an auth flow (password hashing, account
 * creation/activation) — kept here rather than in main-service to match
 * the "auth-service owns all auth work" split. main-service still owns
 * *creating and listing* invites (workspace management), just not this step.
 */
export async function acceptTeamInvite(inviteId: string, rawToken: string, fullName: string, password: string) {
  const invite = await prisma.teamInvite.findUnique({ where: { id: inviteId } });
  if (!invite || invite.status !== TeamInviteStatus.PENDING) {
    throw new AppError("This invite is no longer valid.", 400);
  }
  if (invite.expiresAt < new Date()) {
    throw new AppError("This invite has expired. Ask your workspace owner to send a new one.", 400);
  }

  const isValidToken = await bcrypt.compare(rawToken, invite.tokenHash);
  if (!isValidToken) throw new AppError("Invalid invite link.", 400);

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  const existing = await prisma.account.findUnique({ where: { email: invite.email } });

  const account = existing
    ? await prisma.account.update({
        where: { id: existing.id },
        data: { clientId: invite.clientId, role: invite.role, status: AccountStatus.ACTIVE },
      })
    : await prisma.account.create({
        data: {
          email: invite.email,
          fullName,
          passwordHash,
          role: invite.role,
          clientId: invite.clientId,
          status: AccountStatus.ACTIVE,
          isEmailVerified: true, // invited by an existing verified workspace owner — no separate OTP loop needed
        },
      });

  await prisma.teamInvite.update({ where: { id: invite.id }, data: { status: TeamInviteStatus.ACCEPTED } });
  return account;
}
