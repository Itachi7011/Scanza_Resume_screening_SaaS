import Anthropic from "@anthropic-ai/sdk";
import { env, isClaudeConfigured } from "../config/env";
import { TaxonomySkillDTO } from "./skills.service";
import { WorkerExtractionResult } from "./resumeWorker.service";
import { logger } from "../utils/logger";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return client;
}

const EXTRACTION_SYSTEM_PROMPT = `You are Scanza's resume extraction engine. You will be given a resume file and a list of known skills (with their categories). Extract structured information and respond with ONLY a single valid JSON object — no markdown fences, no commentary — matching EXACTLY this shape:

{
  "contact": { "full_name": string|null, "email": string|null, "phone": string|null, "linkedin_url": string|null, "github_url": string|null, "portfolio_url": string|null, "twitter_url": string|null, "all_emails": string[], "all_phones": string[] },
  "location": { "raw_text": string|null, "country": string|null, "country_code": string|null, "state": string|null, "city": string|null, "postal_code": string|null, "work_mode": "REMOTE"|"HYBRID"|"OPEN_TO_RELOCATION"|null },
  "headline": string|null,
  "summary": string|null,
  "total_experience_years": number|null,
  "experiences": [{ "company": string|null, "title": string|null, "location": string|null, "start_date": "YYYY-MM-DD"|null, "end_date": "YYYY-MM-DD"|null, "is_current": boolean, "description": string|null }],
  "educations": [{ "institution": string|null, "degree": string|null, "field_of_study": string|null, "start_date": "YYYY-MM-DD"|null, "end_date": "YYYY-MM-DD"|null, "grade": string|null }],
  "skills": [{ "skill_id": string, "name": string, "category_name": string, "proficiency": "BEGINNER"|"INTERMEDIATE"|"ADVANCED"|"EXPERT"|"UNKNOWN", "years_of_use": number|null, "mention_count": number, "source_context": string|null, "match_confidence": number }],
  "certifications": [{ "name": string, "issuer": string|null, "issue_date": "YYYY-MM-DD"|null, "expiry_date": "YYYY-MM-DD"|null, "credential_id": string|null }],
  "projects": [{ "name": string, "description": string|null, "technologies": string[], "url": string|null }],
  "languages": [{ "name": string, "proficiency": string|null }],
  "awards": [{ "title": string, "issuer": string|null, "date": "YYYY-MM-DD"|null, "description": string|null }],
  "publications": [{ "title": string, "publisher": string|null, "date": "YYYY-MM-DD"|null, "url": string|null }],
  "detected_language": string|null,
  "ats_issues": [{ "severity": "critical"|"warning"|"info", "message": string }],
  "career_insights": { "employment_gaps": string[], "average_tenure_years": number|null, "job_count_last_5_years": number|null, "shows_job_hopping_pattern": boolean, "shows_career_progression": boolean }|null,
  "confidence_score": number,
  "field_confidence": { "name": number, "email": number, "phone": number, "location": number, "experience": number, "education": number, "skills": number },
  "warnings": string[]
}

Rules:
- ONLY include skills from the provided taxonomy list (match by skill_id). Do not invent skills that aren't in the list.
- "match_confidence" for skills should be 1.0 for skills you're certain about, lower for uncertain/inferred ones.
- "confidence_score" (0-1) reflects your overall confidence in the whole extraction; "field_confidence" breaks that down per field.
- Populate certifications/projects/languages/awards/publications from whatever sections exist — use empty arrays if a section is genuinely absent, never fabricate entries.
- For "ats_issues", flag real formatting/completeness problems (missing sections, no email, resume too short/long) the way a career coach would — don't invent issues that aren't there.
- For "career_insights", only report employment_gaps and patterns you can actually derive from parsed dates — return null if there isn't enough date information to be confident.
- If a field truly cannot be determined, use null rather than guessing.
- Dates must be ISO format (YYYY-MM-DD) or null.`;

export async function extractWithClaude(
  fileBuffer: Buffer,
  mimeType: string,
  taxonomy: TaxonomySkillDTO[]
): Promise<WorkerExtractionResult> {
  if (!isClaudeConfigured) {
    throw new Error("Claude API key not configured");
  }

  const base64Data = fileBuffer.toString("base64");

  // Cast to `any` here deliberately: Anthropic's SDK has changed its content-
  // block type unions across versions (document/PDF support landed after
  // some published .d.ts snapshots), so a strict union type here is brittle
  // against whatever exact patch version npm resolves. The runtime request
  // shape below is correct per Anthropic's current API regardless.
  const message = await getClient().messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 4096,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: mimeType as "application/pdf", data: base64Data },
          },
          {
            type: "text",
            text: `Known skills taxonomy (only match against these):\n${JSON.stringify(taxonomy)}`,
          },
        ] as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  const cleaned = textBlock.text.trim().replace(/^```json\s*/i, "").replace(/```$/, "");
  const parsed = JSON.parse(cleaned);

  return {
    engine: "CLAUDE_LLM",
    raw_text: "", // Claude reads the PDF directly; we don't get separate raw text back
    ...parsed,
  } as WorkerExtractionResult;
}

/**
 * Tries Claude first (if configured). On ANY failure — missing key, API
 * error, malformed JSON response, rate limit, etc — logs a single warning
 * and returns null so the caller falls back to the offline worker. This
 * function NEVER throws.
 */
export async function tryExtractWithClaude(
  fileBuffer: Buffer,
  mimeType: string,
  taxonomy: TaxonomySkillDTO[]
): Promise<WorkerExtractionResult | null> {
  if (!isClaudeConfigured) return null;

  try {
    return await extractWithClaude(fileBuffer, mimeType, taxonomy);
  } catch (err) {
    logger.warn("Claude extraction failed, falling back to resume-worker", {
      error: (err as Error).message,
    });
    return null;
  }
}