import { z } from "zod";

export const resumeIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const submitResumeViaApiSchema = z.object({
  body: z.object({
    externalUserRef: z.string().min(1).max(255).optional(),
  }),
});

export const updateClientSettingsSchema = z.object({
  body: z.object({
    companyName: z.string().min(2).max(150).optional(),
    websiteUrl: z.string().url().optional(),
    webhookUrl: z.string().url().optional().or(z.literal("")),
    allowedOrigins: z.array(z.string().url()).optional(),
  }),
});

export const createApiKeySchema = z.object({
  body: z.object({
    label: z.string().min(2).max(100),
  }),
});

export const createJobPostingSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(150),
    department: z.string().max(100).optional(),
    location: z.string().max(150).optional(),
    description: z.string().min(30, "Please provide a fuller job description."),
    requiredSkillIds: z.array(z.string()).optional(),
  }),
});

export const updateJobPostingSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(150).optional(),
    department: z.string().max(100).optional(),
    location: z.string().max(150).optional(),
    description: z.string().min(30).optional(),
    requiredSkillIds: z.array(z.string()).optional(),
    status: z.enum(["DRAFT", "OPEN", "CLOSED"]).optional(),
  }),
});

export const matchJobSchema = z.object({
  body: z.object({
    jobDescription: z.string().min(30, "Please paste a fuller job description."),
  }),
});
