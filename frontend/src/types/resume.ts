export interface ExtractedProfile {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  headline: string | null;
  summary: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  twitterUrl: string | null;
  allEmails: string[];
  allPhones: string[];
  totalExperienceYears: number | null;
  confidenceScore: number | null;
}

export interface ResumeExperience {
  id: string;
  company: string | null;
  title: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
}

export interface ResumeEducation {
  id: string;
  institution: string | null;
  degree: string | null;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  grade: string | null;
}

export interface ResumeSkillEntry {
  id: string;
  proficiency: string;
  yearsOfUse: number | null;
  mentionCount: number;
  skill: {
    name: string;
    category: { name: string; icon: string | null; parent?: { name: string } | null };
  };
}

export interface ScoreResult {
  overallScore: number;
  completenessScore: number;
  skillsScore: number;
  experienceScore: number;
  formattingScore: number;
  keywordScore: number;
  breakdown: { reasons?: string[]; [key: string]: unknown };
}

export interface Suggestion {
  id: string;
  category: string;
  severity: "critical" | "warning" | "tip";
  message: string;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  credentialId: string | null;
}

export interface ResumeProjectEntry {
  id: string;
  name: string;
  description: string | null;
  technologies: string[];
  url: string | null;
}

export interface LanguageEntry {
  id: string;
  name: string;
  proficiency: string | null;
}

export interface AwardEntry {
  id: string;
  title: string;
  issuer: string | null;
  date: string | null;
  description: string | null;
}

export interface PublicationEntry {
  id: string;
  title: string;
  publisher: string | null;
  date: string | null;
  url: string | null;
}

export interface AtsIssue {
  severity: "critical" | "warning" | "info";
  message: string;
}

export interface CareerInsights {
  employment_gaps: string[];
  average_tenure_years: number | null;
  job_count_last_5_years: number | null;
  shows_job_hopping_pattern: boolean;
  shows_career_progression: boolean;
}

export interface JobMatchResult {
  matchScore: number;
  matchedSkillIds: string[];
  missingSkillIds: string[];
  matchedSkillNames: string[];
  missingSkillNames: string[];
  breakdown: Record<string, unknown>;
}

export interface ResumeResult {
  id: string;
  originalFileName: string;
  extractionStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  extractionEngine: "CLAUDE_LLM" | "FALLBACK_WORKER" | "HYBRID" | null;
  profile: ExtractedProfile | null;
  experiences: ResumeExperience[];
  educations: ResumeEducation[];
  skills: ResumeSkillEntry[];
  scoreResult: ScoreResult | null;
  suggestions: Suggestion[];
  certifications: CertificationEntry[];
  projects: ResumeProjectEntry[];
  languages: LanguageEntry[];
  awards: AwardEntry[];
  publications: PublicationEntry[];
  atsIssues: AtsIssue[] | null;
  careerInsights: CareerInsights | null;
  detectedLanguage: string | null;
  workMode: string | null;
  createdAt: string;
}
