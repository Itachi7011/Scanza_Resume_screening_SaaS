import { WorkerExtractionResult } from "./resumeWorker.service";
import { ScoreBreakdown } from "./scoring.service";

export interface SuggestionDTO {
  category: string;
  severity: "critical" | "warning" | "tip";
  message: string;
}

const ACTION_VERBS = [
  "led", "built", "designed", "implemented", "launched", "improved", "reduced",
  "increased", "created", "managed", "developed", "optimized", "delivered",
];
const METRIC_RE = /\d+%|\$\d|\b\d{2,}\+?\b/;

export function generateSuggestions(extraction: WorkerExtractionResult, score: ScoreBreakdown): SuggestionDTO[] {
  const suggestions: SuggestionDTO[] = [];

  // Promote the score engine's own reasoning first — it's already specific.
  for (const reason of (score.breakdown.reasons as string[]) ?? []) {
    suggestions.push({ category: "Overall Quality", severity: "warning", message: reason });
  }

  if (!extraction.contact.email) {
    suggestions.push({ category: "Contact Info", severity: "critical", message: "We couldn't find an email address — make sure it's clearly visible near the top of your resume." });
  }
  if (!extraction.contact.linkedin_url) {
    suggestions.push({ category: "Contact Info", severity: "tip", message: "Consider adding your LinkedIn profile URL — many recruiters check it before reaching out." });
  }
  if (!extraction.contact.github_url && extraction.skills.some((s) => ["Frontend Development", "Backend Development", "Systems & Languages"].includes(s.category_name))) {
    suggestions.push({ category: "Contact Info", severity: "tip", message: "You list technical skills but no GitHub link — adding one lets recruiters see your work directly." });
  }

  const descriptionsText = extraction.experiences.map((e) => e.description ?? "").join(" ").toLowerCase();
  const hasActionVerbs = ACTION_VERBS.some((v) => descriptionsText.includes(v));
  const hasMetrics = METRIC_RE.test(descriptionsText);

  if (extraction.experiences.length > 0 && !hasActionVerbs) {
    suggestions.push({
      category: "Impact & Wording",
      severity: "warning",
      message: 'Start bullet points with strong action verbs (e.g. "Led", "Built", "Reduced") instead of passive phrasing.',
    });
  }
  if (extraction.experiences.length > 0 && !hasMetrics) {
    suggestions.push({
      category: "Impact & Wording",
      severity: "warning",
      message: "Add quantifiable results where possible (e.g. \"reduced load time by 40%\", \"managed a team of 6\") — numbers make impact concrete.",
    });
  }

  if (extraction.educations.length === 0) {
    suggestions.push({ category: "Education", severity: "tip", message: "No education section was detected — add your degree(s) even if you have significant work experience." });
  }

  if (score.overallScore >= 85) {
    suggestions.push({ category: "Overall Quality", severity: "tip", message: "Strong resume overall — minor polish could push it further, but the fundamentals are solid." });
  }

  return suggestions;
}
