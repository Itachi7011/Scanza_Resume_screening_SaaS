import axios from "axios";
import FormData from "form-data";
import { env } from "../config/env";
import { TaxonomySkillDTO } from "./skills.service";
import { logger } from "../utils/logger";
import { AppError } from "../utils/AppError";

/** Mirrors resume-worker's ExtractionResult Pydantic model exactly. */
export interface WorkerExtractionResult {
  engine: string;
  raw_text: string;
  contact: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    linkedin_url: string | null;
    github_url: string | null;
    portfolio_url: string | null;
    twitter_url: string | null;
    all_emails: string[];
    all_phones: string[];
  };
  location: {
    raw_text: string | null;
    country: string | null;
    country_code: string | null;
    state: string | null;
    city: string | null;
    postal_code: string | null;
    work_mode: string | null;
  };
  headline: string | null;
  summary: string | null;
  total_experience_years: number | null;
  experiences: Array<{
    company: string | null;
    title: string | null;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    is_current: boolean;
    description: string | null;
  }>;
  educations: Array<{
    institution: string | null;
    degree: string | null;
    field_of_study: string | null;
    start_date: string | null;
    end_date: string | null;
    grade: string | null;
  }>;
  skills: Array<{
    skill_id: string;
    name: string;
    category_name: string;
    proficiency: string;
    years_of_use: number | null;
    mention_count: number;
    source_context: string | null;
    match_confidence: number;
  }>;
  certifications: Array<{
    name: string;
    issuer: string | null;
    issue_date: string | null;
    expiry_date: string | null;
    credential_id: string | null;
  }>;
  projects: Array<{
    name: string;
    description: string | null;
    technologies: string[];
    url: string | null;
  }>;
  languages: Array<{ name: string; proficiency: string | null }>;
  awards: Array<{ title: string; issuer: string | null; date: string | null; description: string | null }>;
  publications: Array<{ title: string; publisher: string | null; date: string | null; url: string | null }>;
  detected_language: string | null;
  ats_issues: Array<{ severity: string; message: string }>;
  career_insights: {
    employment_gaps: string[];
    average_tenure_years: number | null;
    job_count_last_5_years: number | null;
    shows_job_hopping_pattern: boolean;
    shows_career_progression: boolean;
  } | null;
  confidence_score: number;
  field_confidence: Record<string, number>;
  warnings: string[];
}

export async function extractWithFallbackWorker(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  taxonomy: TaxonomySkillDTO[]
): Promise<WorkerExtractionResult> {
  const form = new FormData();
  form.append("file", fileBuffer, { filename: fileName, contentType: mimeType });
  form.append("skills_taxonomy", JSON.stringify(taxonomy));

  try {
    const response = await axios.post<WorkerExtractionResult>(`${env.RESUME_WORKER_URL}/extract`, form, {
      headers: form.getHeaders(),
      timeout: 30_000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return response.data;
  } catch (err) {
    logger.error("resume-worker extraction failed", { error: (err as Error).message });
    throw new AppError(
      "Resume extraction failed. Both the AI extractor and the fallback engine were unavailable — please try again shortly.",
      502
    );
  }
}
