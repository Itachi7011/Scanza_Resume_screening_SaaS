import { z } from "zod";

export const dateRangeQuerySchema = z.object({
  query: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    preset: z.enum(["today", "week", "month", "year", "custom"]).optional(),
  }),
});

export const listUsersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(20),
    search: z.string().optional(),
    role: z.string().optional(),
    status: z.string().optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const updatePlatformSettingsSchema = z.object({
  body: z.object({
    maintenanceMode: z.boolean().optional(),
    allowNewSignups: z.boolean().optional(),
    freeMonthlyQuota: z.number().int().positive().optional(),
    maxUploadSizeMb: z.number().int().positive().optional(),
    announcementBanner: z.string().max(500).nullable().optional(),
  }),
});

export const changeRoleSchema = z.object({
  body: z.object({
    role: z.enum(["SUPER_ADMIN", "ADMIN", "CLIENT_OWNER", "CLIENT_MEMBER", "END_USER"]),
  }),
});
