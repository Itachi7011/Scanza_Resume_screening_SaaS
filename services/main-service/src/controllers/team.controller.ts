import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";
import * as teamService from "../services/team.service";
import { notify } from "../services/notification.service";
import { NotificationType } from "@prisma/client";

function requireClientId(req: Request): string {
  if (!req.account?.clientId) throw new AppError("This account is not associated with a SaaS client workspace.", 403);
  return req.account.clientId;
}

export const listTeam = asyncHandler(async (req: Request, res: Response) => {
  const team = await teamService.listTeam(requireClientId(req));
  return sendSuccess(res, team, "Team fetched.");
});

export const inviteTeamMember = asyncHandler(async (req: Request, res: Response) => {
  const { email, role } = req.body;
  const invite = await teamService.inviteTeamMember(requireClientId(req), req.account!.id, email, role);
  await notify({
    accountId: req.account!.id,
    type: NotificationType.TEAM_INVITE_SENT,
    title: "Invite sent",
    message: `An invitation was sent to ${email}.`,
  });
  return sendSuccess(res, invite, "Invite sent.", 201);
});

export const revokeInvite = asyncHandler(async (req: Request, res: Response) => {
  await teamService.revokeInvite(requireClientId(req), req.params.id);
  return sendSuccess(res, null, "Invite revoked.");
});
