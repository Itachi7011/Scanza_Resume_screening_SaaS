import { Request, Response } from "express";
import { ResumeSource } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";
import { prisma } from "../config/database";
import { processResume } from "../services/resume.service";
import { deleteResumeFile } from "../services/cloudinary.service";
import { computeJobMatch } from "../services/matching.service";

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
 * Homepage direct-upload endpoint. Works for BOTH logged-in users (resume
 * is saved to their account, see optionalAuthenticate) and anonymous
 * visitors (analyzed but not persisted to any account — still saved as a
 * Resume row so admins can see anonymous usage volume, just with no owner).
 */
export const uploadResume = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError("No file uploaded.", 400);

  const result = await processResume({
    fileBuffer: req.file.buffer,
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    ownerAccountId: req.account?.id,
    source: ResumeSource.DIRECT_UPLOAD,
  });

  const fullResume = await prisma.resume.findUnique({
    where: { id: result.resumeId },
    include: RESUME_DETAIL_INCLUDE,
  });

  return sendSuccess(res, fullResume, "Resume analyzed successfully.", 201);
});

export const getMyResumes = asyncHandler(async (req: Request, res: Response) => {
  const resumes = await prisma.resume.findMany({
    where: { ownerAccountId: req.account!.id },
    orderBy: { createdAt: "desc" },
    include: { scoreResult: true, profile: true },
  });
  return sendSuccess(res, resumes, "Resumes fetched.");
});

export const getResumeById = asyncHandler(async (req: Request, res: Response) => {
  const resume = await prisma.resume.findUnique({
    where: { id: req.params.id },
    include: RESUME_DETAIL_INCLUDE,
  });

  if (!resume) throw new AppError("Resume not found.", 404);
  if (resume.ownerAccountId && resume.ownerAccountId !== req.account?.id) {
    throw new AppError("You do not have access to this resume.", 403);
  }

  return sendSuccess(res, resume, "Resume fetched.");
});

export const deleteResume = asyncHandler(async (req: Request, res: Response) => {
  const resume = await prisma.resume.findUnique({ where: { id: req.params.id } });
  if (!resume) throw new AppError("Resume not found.", 404);
  if (resume.ownerAccountId !== req.account!.id) {
    throw new AppError("You do not have access to this resume.", 403);
  }

  await deleteResumeFile(resume.cloudinaryPublicId).catch(() => void 0);
  await prisma.resume.delete({ where: { id: resume.id } });

  return sendSuccess(res, null, "Resume deleted.");
});

/**
 * The Jobscan-style "paste a job description, see your match score"
 * feature. Deliberately lightweight — reuses the resume's ALREADY
 * extracted skills rather than re-running extraction, so this responds in
 * well under a second and works from the free tier without eating into
 * upload quota.
 */
export const matchResumeAgainstJob = asyncHandler(async (req: Request, res: Response) => {
  const resume = await prisma.resume.findUnique({ where: { id: req.params.id } });
  if (!resume) throw new AppError("Resume not found.", 404);
  if (resume.ownerAccountId && resume.ownerAccountId !== req.account?.id) {
    throw new AppError("You do not have access to this resume.", 403);
  }

  const { jobDescription } = req.body;
  if (!jobDescription || jobDescription.trim().length < 30) {
    throw new AppError("Please paste a fuller job description (at least a few sentences).", 400);
  }

  const result = await computeJobMatch(resume.id, jobDescription);
  return sendSuccess(res, result, "Match computed.");
});
