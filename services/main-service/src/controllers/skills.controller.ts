import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { getFullTaxonomyTree } from "../services/skills.service";

export const getSkillTaxonomy = asyncHandler(async (_req: Request, res: Response) => {
  const tree = await getFullTaxonomyTree();
  return sendSuccess(res, tree, "Skill taxonomy fetched.");
});
