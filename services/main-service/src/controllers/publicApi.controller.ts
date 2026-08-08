import { Request, Response } from "express";
import { ResumeSource } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";
import { prisma } from "../config/database";
import { processResume } from "../services/resume.service";

const RESUME_DETAIL_INCLUDE = {
  profile: true,
  experiences: { orderBy: { order: "asc" as const } },
  educations: { orderBy: { order: "asc" as const } },
  skills: { include: { skill: { include: { category: true } } } },
  scoreResult: true,
  suggestions: { orderBy: { order: "asc" as const } },
  certifications: true,
  projects: true,
  languages: true,
  awards: true,
  publications: true,
};

/**
 * POST /api/app/v1/resumes  (X-API-Key required)
 *
 * This is the integration endpoint documented for client companies —
 * e.g. their own careers page posts an applicant's resume here (optionally
 * tagging it with `externalUserRef`, the client's own user/applicant id),
 * and either polls GET /api/app/v1/resumes/:id or receives the result on
 * their configured webhookUrl.
 */
export const submitResumeViaApi = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError("No file uploaded. Send it as multipart/form-data field 'file'.", 400);

  const result = await processResume({
    fileBuffer: req.file.buffer,
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    clientId: req.apiClient!.clientId,
    externalUserRef: req.body.externalUserRef,
    source: ResumeSource.CLIENT_API,
  });

  await prisma.client.update({
    where: { id: req.apiClient!.clientId },
    data: { usedThisCycle: { increment: 1 } },
  });

  return sendSuccess(res, { resumeId: result.resumeId, score: result.score.overallScore, engine: result.engine }, "Resume submitted and processed.", 201);
});

export const getResumeResultViaApi = asyncHandler(async (req: Request, res: Response) => {
  const resume = await prisma.resume.findUnique({
    where: { id: req.params.id },
    include: RESUME_DETAIL_INCLUDE,
  });

  if (!resume || resume.clientId !== req.apiClient!.clientId) {
    throw new AppError("Resume not found.", 404);
  }

  return sendSuccess(res, resume, "Resume fetched.");
});

export const listResumesViaApi = asyncHandler(async (req: Request, res: Response) => {
  const { externalUserRef } = req.query;
  const resumes = await prisma.resume.findMany({
    where: {
      clientId: req.apiClient!.clientId,
      externalUserRef: typeof externalUserRef === "string" ? externalUserRef : undefined,
    },
    orderBy: { createdAt: "desc" },
    include: { scoreResult: true, profile: true },
  });
  return sendSuccess(res, resumes, "Resumes fetched.");
});
