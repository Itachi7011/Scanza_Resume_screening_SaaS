import { z } from "zod";

export const inviteTeamMemberSchema = z.object({
  body: z.object({
    email: z.string().email(),
    role: z.enum(["CLIENT_OWNER", "CLIENT_MEMBER"]).default("CLIENT_MEMBER"),
  }),
});

export const acceptInviteSchema = z.object({
  body: z.object({
    inviteId: z.string().uuid(),
    token: z.string().min(20),
    fullName: z.string().min(2),
    password: z.string().min(8),
  }),
});
