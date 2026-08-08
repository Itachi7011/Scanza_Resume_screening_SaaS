import { prisma } from "../config/database";

export interface MatchResult {
  matchScore: number;
  matchedSkillIds: string[];
  missingSkillIds: string[];
  matchedSkillNames: string[];
  missingSkillNames: string[];
  breakdown: Record<string, unknown>;
}

interface TaxonomySkillRow {
  id: string;
  name: string;
  aliases: string[];
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Finds which taxonomy skills are mentioned in arbitrary text (a job
 * description) using the same whole-word matching philosophy as the
 * resume-worker's PhraseMatcher — word-boundary regex, not substring
 * search, so short skill names ("R", "Go", "C") don't false-positive
 * inside unrelated words.
 */
function extractSkillIdsFromText(text: string, taxonomy: TaxonomySkillRow[]): string[] {
  const found: string[] = [];
  for (const skill of taxonomy) {
    const names = [skill.name, ...skill.aliases];
    const matched = names.some((name) => new RegExp(`\\b${escapeRegExp(name)}\\b`, "i").test(text));
    if (matched) found.push(skill.id);
  }
  return found;
}

/**
 * Core matching algorithm: how well does a resume's already-extracted
 * skill set cover the skills mentioned in a job description?
 *
 * This deliberately reuses the SAME skill taxonomy as extraction (rather
 * than a separate keyword list) so "matched" and "missing" skills are
 * always ones the person could plausibly add to their categorized skills
 * section — actionable, not just a returned keyword soup.
 */
export async function computeJobMatch(resumeId: string, jobDescriptionText: string): Promise<MatchResult> {
  const [resumeSkills, taxonomy] = await Promise.all([
    prisma.resumeSkill.findMany({ where: { resumeId }, include: { skill: true } }),
    prisma.skill.findMany({ select: { id: true, name: true, aliases: true } }),
  ]);

  const resumeSkillIds = new Set(resumeSkills.map((rs) => rs.skillId));
  const jdSkillIds = extractSkillIdsFromText(jobDescriptionText, taxonomy);

  const matchedSkillIds = jdSkillIds.filter((id) => resumeSkillIds.has(id));
  const missingSkillIds = jdSkillIds.filter((id) => !resumeSkillIds.has(id));

  // Skill coverage is the primary signal (70%). A secondary signal (30%) is
  // how experienced the person is with the skills they DO have in common —
  // someone with EXPERT-level overlap should score higher than someone who
  // just barely mentions the same skills once.
  const skillCoverageRatio = jdSkillIds.length > 0 ? matchedSkillIds.length / jdSkillIds.length : 0.5;

  const matchedResumeSkillRows = resumeSkills.filter((rs) => matchedSkillIds.includes(rs.skillId));
  const proficiencyWeight: Record<string, number> = { EXPERT: 1, ADVANCED: 0.8, INTERMEDIATE: 0.6, BEGINNER: 0.4, UNKNOWN: 0.5 };
  const avgProficiency = matchedResumeSkillRows.length
    ? matchedResumeSkillRows.reduce((sum, rs) => sum + (proficiencyWeight[rs.proficiency] ?? 0.5), 0) / matchedResumeSkillRows.length
    : 0.5;

  const matchScore = Math.round(skillCoverageRatio * 70 + avgProficiency * 30);

  const idToName = new Map(taxonomy.map((s) => [s.id, s.name]));

  return {
    matchScore: Math.max(0, Math.min(100, matchScore)),
    matchedSkillIds,
    missingSkillIds,
    matchedSkillNames: matchedSkillIds.map((id) => idToName.get(id) ?? id),
    missingSkillNames: missingSkillIds.map((id) => idToName.get(id) ?? id),
    breakdown: {
      totalSkillsInJobDescription: jdSkillIds.length,
      totalSkillsMatched: matchedSkillIds.length,
      skillCoverageRatio: Math.round(skillCoverageRatio * 100) / 100,
      averageProficiencyOfMatchedSkills: Math.round(avgProficiency * 100) / 100,
      method: "Taxonomy-based whole-word skill matching against the job description, weighted by proficiency of overlapping skills.",
    },
  };
}
