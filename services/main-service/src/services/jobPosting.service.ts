import { JobPostingStatus } from "@prisma/client";
import { prisma } from "../config/database";
import { computeJobMatch } from "./matching.service";
import { AppError } from "../utils/AppError";

export async function createJobPosting(clientId: string, data: {
  title: string; department?: string; location?: string; description: string; requiredSkillIds?: string[];
}) {
  return prisma.jobPosting.create({
    data: { clientId, ...data, status: JobPostingStatus.DRAFT },
  });
}

export async function listJobPostings(clientId: string) {
  return prisma.jobPosting.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { matches: true } } },
  });
}

export async function updateJobPosting(clientId: string, jobPostingId: string, data: Partial<{
  title: string; department: string; location: string; description: string; requiredSkillIds: string[]; status: JobPostingStatus;
}>) {
  const posting = await prisma.jobPosting.findUnique({ where: { id: jobPostingId } });
  if (!posting || posting.clientId !== clientId) throw new AppError("Job posting not found.", 404);
  return prisma.jobPosting.update({ where: { id: jobPostingId }, data });
}

export async function deleteJobPosting(clientId: string, jobPostingId: string) {
  const posting = await prisma.jobPosting.findUnique({ where: { id: jobPostingId } });
  if (!posting || posting.clientId !== clientId) throw new AppError("Job posting not found.", 404);
  await prisma.jobPosting.delete({ where: { id: jobPostingId } });
}

/**
 * Recomputes match scores between this job posting and every resume
 * belonging to the client (i.e. every candidate submitted through their
 * integration or dashboard). This is what turns a pile of individually
 *-submitted resumes into a ranked candidate shortlist — the actual
 * Greenhouse-style value-add, not just "parse one resume at a time."
 */
export async function computeMatchesForPosting(clientId: string, jobPostingId: string) {
  const posting = await prisma.jobPosting.findUnique({ where: { id: jobPostingId } });
  if (!posting || posting.clientId !== clientId) throw new AppError("Job posting not found.", 404);

  const resumes = await prisma.resume.findMany({
    where: { clientId, extractionStatus: "COMPLETED" },
    select: { id: true },
  });

  const results = [];
  for (const resume of resumes) {
    const match = await computeJobMatch(resume.id, posting.description);
    const saved = await prisma.jobMatch.upsert({
      where: { jobPostingId_resumeId: { jobPostingId, resumeId: resume.id } },
      create: {
        jobPostingId,
        resumeId: resume.id,
        matchScore: match.matchScore,
        matchedSkillIds: match.matchedSkillIds,
        missingSkillIds: match.missingSkillIds,
        breakdown: match.breakdown as object,
      },
      update: {
        matchScore: match.matchScore,
        matchedSkillIds: match.matchedSkillIds,
        missingSkillIds: match.missingSkillIds,
        breakdown: match.breakdown as object,
        computedAt: new Date(),
      },
    });
    results.push(saved);
  }

  return results.sort((a, b) => b.matchScore - a.matchScore);
}

export async function getJobPostingWithRankedCandidates(clientId: string, jobPostingId: string) {
  const posting = await prisma.jobPosting.findUnique({
    where: { id: jobPostingId },
    include: {
      matches: {
        orderBy: { matchScore: "desc" },
        include: {
          resume: {
            include: { profile: true, scoreResult: true },
          },
        },
      },
    },
  });
  if (!posting || posting.clientId !== clientId) throw new AppError("Job posting not found.", 404);
  return posting;
}
