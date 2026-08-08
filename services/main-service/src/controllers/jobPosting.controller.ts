import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";
import * as jobPostingService from "../services/jobPosting.service";

function requireClientId(req: Request): string {
  if (!req.account?.clientId) throw new AppError("This account is not associated with a SaaS client workspace.", 403);
  return req.account.clientId;
}

export const createJobPosting = asyncHandler(async (req: Request, res: Response) => {
  const posting = await jobPostingService.createJobPosting(requireClientId(req), req.body);
  return sendSuccess(res, posting, "Job posting created.", 201);
});

export const listJobPostings = asyncHandler(async (req: Request, res: Response) => {
  const postings = await jobPostingService.listJobPostings(requireClientId(req));
  return sendSuccess(res, postings, "Job postings fetched.");
});

export const updateJobPosting = asyncHandler(async (req: Request, res: Response) => {
  const posting = await jobPostingService.updateJobPosting(requireClientId(req), req.params.id, req.body);
  return sendSuccess(res, posting, "Job posting updated.");
});

export const deleteJobPosting = asyncHandler(async (req: Request, res: Response) => {
  await jobPostingService.deleteJobPosting(requireClientId(req), req.params.id);
  return sendSuccess(res, null, "Job posting deleted.");
});

export const computeMatches = asyncHandler(async (req: Request, res: Response) => {
  const results = await jobPostingService.computeMatchesForPosting(requireClientId(req), req.params.id);
  return sendSuccess(res, results, `Computed matches for ${results.length} candidate(s).`);
});

export const getJobPostingDetail = asyncHandler(async (req: Request, res: Response) => {
  const posting = await jobPostingService.getJobPostingWithRankedCandidates(requireClientId(req), req.params.id);
  return sendSuccess(res, posting, "Job posting fetched.");
});
