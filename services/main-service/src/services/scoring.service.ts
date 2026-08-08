import { WorkerExtractionResult } from "./resumeWorker.service";

export interface ScoreBreakdown {
  overallScore: number;
  completenessScore: number;
  skillsScore: number;
  experienceScore: number;
  formattingScore: number;
  keywordScore: number;
  breakdown: Record<string, unknown>;
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Every sub-score below is a simple, explainable rubric — deliberately NOT
 * a black box, because "why did my resume get 62?" needs a real answer.
 * The `breakdown` field returned alongside carries the reasoning so the
 * frontend can show it to the user, not just a bare number.
 */
export function computeResumeScore(extraction: WorkerExtractionResult): ScoreBreakdown {
  const reasons: string[] = [];

  // --- Completeness: how many key profile fields are actually filled in ---
  const completenessFields = [
    extraction.contact.full_name,
    extraction.contact.email,
    extraction.contact.phone,
    extraction.location.country,
    extraction.summary,
    extraction.experiences.length > 0,
    extraction.educations.length > 0,
  ];
  const filledCount = completenessFields.filter(Boolean).length;
  const completenessScore = clamp(Math.round((filledCount / completenessFields.length) * 100));
  if (!extraction.summary) reasons.push("No professional summary detected — consider adding one.");
  if (!extraction.contact.phone) reasons.push("No phone number detected.");

  // --- Skills: rewards breadth AND having some skills with real confidence ---
  const skillCount = extraction.skills.length;
  const highConfidenceSkills = extraction.skills.filter((s) => s.match_confidence >= 0.85).length;
  const skillsScore = clamp(Math.round(Math.min(skillCount, 15) / 15 * 70 + Math.min(highConfidenceSkills, 10) / 10 * 30));
  if (skillCount < 5) reasons.push("Fewer than 5 skills detected — consider listing more relevant technical/soft skills.");

  // --- Experience: rewards having entries with descriptions and reasonable tenure ---
  const experiencesWithDescriptions = extraction.experiences.filter((e) => e.description && e.description.length > 30).length;
  const experienceScore = clamp(
    Math.round(
      Math.min(extraction.experiences.length, 4) / 4 * 40 +
        Math.min(experiencesWithDescriptions, 4) / 4 * 40 +
        Math.min(extraction.total_experience_years ?? 0, 10) / 10 * 20
    )
  );
  if (experiencesWithDescriptions < extraction.experiences.length) {
    reasons.push("Some work experience entries are missing detailed descriptions of your impact.");
  }

  // --- Formatting: penalizes very short/likely-malformed descriptions and warnings from extraction ---
  const avgDescLength =
    extraction.experiences.length > 0
      ? extraction.experiences.reduce((sum, e) => sum + (e.description?.length ?? 0), 0) / extraction.experiences.length
      : 0;
  let formattingScore = 100;
  if (avgDescLength < 40) formattingScore -= 25;
  if (extraction.warnings.length > 0) formattingScore -= 20 * Math.min(extraction.warnings.length, 2);
  formattingScore = clamp(formattingScore);
  if (avgDescLength < 40 && extraction.experiences.length > 0) {
    reasons.push("Work experience bullet points are quite short — add more specific, quantified detail.");
  }

  // --- Keyword coverage: rewards skills spanning multiple categories (breadth signal) ---
  const uniqueCategories = new Set(extraction.skills.map((s) => s.category_name)).size;
  const keywordScore = clamp(Math.round(Math.min(uniqueCategories, 5) / 5 * 100));
  if (uniqueCategories < 2 && skillCount > 0) {
    reasons.push("Skills are concentrated in a single category — a broader mix often reads stronger to recruiters.");
  }

  const overallScore = clamp(
    Math.round(
      completenessScore * 0.25 +
        skillsScore * 0.25 +
        experienceScore * 0.25 +
        formattingScore * 0.15 +
        keywordScore * 0.1
    )
  );

  return {
    overallScore,
    completenessScore,
    skillsScore,
    experienceScore,
    formattingScore,
    keywordScore,
    breakdown: {
      filledProfileFields: `${filledCount}/${completenessFields.length}`,
      totalSkillsDetected: skillCount,
      highConfidenceSkills,
      experienceEntriesWithDetail: `${experiencesWithDescriptions}/${extraction.experiences.length}`,
      skillCategorySpread: uniqueCategories,
      reasons,
    },
  };
}
