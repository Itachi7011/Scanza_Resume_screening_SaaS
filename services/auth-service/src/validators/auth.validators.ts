import { z } from "zod";

const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain a special character");

export const signupSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).max(100),
    email: z.string().email().toLowerCase(),
    password: strongPassword,
    // Only present when a company is signing up as a SaaS client, not an end user.
    companyName: z.string().min(2).max(150).optional(),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    accountId: z.string().uuid(),
    code: z.string().length(6),
  }),
});

export const resendOtpSchema = z.object({
  body: z.object({
    accountId: z.string().uuid(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(1, "Password is required"),
  }),
});

export const adminLoginSchema = loginSchema;

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    accountId: z.string().uuid(),
    code: z.string().length(6),
    newPassword: strongPassword,
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: strongPassword,
  }),
});

export const acceptInviteSchema = z.object({
  body: z.object({
    inviteId: z.string().uuid(),
    token: z.string().min(20),
    fullName: z.string().min(2).max(100),
    password: strongPassword,
  }),
});
