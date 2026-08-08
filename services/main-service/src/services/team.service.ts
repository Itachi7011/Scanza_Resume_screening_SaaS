import crypto from "crypto";
import bcrypt from "bcryptjs";
import { AccountRole, TeamInviteStatus } from "@prisma/client";
import { prisma } from "../config/database";
import { AppError } from "../utils/AppError";
import { sendEmail, teamInviteEmailTemplate } from "./email.service";
import { env } from "../config/env";

const INVITE_EXPIRY_DAYS = 7;

export async function inviteTeamMember(clientId: string, invitedByAccountId: string, email: string, role: AccountRole) {
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });

  const existingAccount = await prisma.account.findUnique({ where: { email } });
  if (existingAccount?.clientId === clientId) {
    throw new AppError("This person is already a member of your workspace.", 409);
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = await bcrypt.hash(rawToken, 10);

  await prisma.teamInvite.updateMany({
    where: { clientId, email, status: TeamInviteStatus.PENDING },
    data: { status: TeamInviteStatus.EXPIRED },
  });

  const invite = await prisma.teamInvite.create({
    data: {
      clientId,
      email,
      role,
      tokenHash,
      invitedBy: invitedByAccountId,
      expiresAt: new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  const inviteUrl = `${env.FRONTEND_URL}/accept-invite?inviteId=${invite.id}&token=${rawToken}`;
  const template = teamInviteEmailTemplate(client.companyName, inviteUrl);
  await sendEmail({ to: email, ...template });

  return invite;
}

export async function listTeam(clientId: string) {
  const [members, pendingInvites] = await Promise.all([
    prisma.account.findMany({
      where: { clientId },
      select: { id: true, fullName: true, email: true, role: true, status: true, createdAt: true, lastLoginAt: true },
    }),
    prisma.teamInvite.findMany({ where: { clientId, status: TeamInviteStatus.PENDING }, orderBy: { createdAt: "desc" } }),
  ]);
  return { members, pendingInvites };
}

export async function revokeInvite(clientId: string, inviteId: string) {
  const invite = await prisma.teamInvite.findUnique({ where: { id: inviteId } });
  if (!invite || invite.clientId !== clientId) throw new AppError("Invite not found.", 404);
  await prisma.teamInvite.update({ where: { id: inviteId }, data: { status: TeamInviteStatus.REVOKED } });
}

// NOTE: accepting an invite (creating/updating the Account with a password)
// is intentionally handled in auth-service, not here — it's an auth flow
// (password hashing, account creation), matching the "auth-service owns all
// auth work" split. See services/auth-service/src/services/invite.service.ts.
