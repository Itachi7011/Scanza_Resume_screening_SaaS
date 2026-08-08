from typing import List, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------
# Input: main-service sends the current skill taxonomy alongside the file
# so the worker never needs its own database connection. This list mirrors
# the Skill + SkillCategory Prisma models 1:1.
# ---------------------------------------------------------------------
class SkillTaxonomyItem(BaseModel):
    skill_id: str
    name: str
    aliases: List[str] = Field(default_factory=list)
    category_id: str
    category_name: str
    parent_category_name: Optional[str] = None


# ---------------------------------------------------------------------
# Output models — this shape maps directly onto ExtractedProfile,
# Experience, Education, and ResumeSkill in the Prisma schema so
# main-service can persist the response with minimal transformation.
# ---------------------------------------------------------------------
class ContactInfo(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    twitter_url: Optional[str] = None
    all_emails: List[str] = Field(default_factory=list)
    all_phones: List[str] = Field(default_factory=list)


class LocationInfo(BaseModel):
    raw_text: Optional[str] = None
    country: Optional[str] = None
    country_code: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    work_mode: Optional[str] = None  # REMOTE | HYBRID | OPEN_TO_RELOCATION | None


class ExperienceEntry(BaseModel):
    company: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[str] = None  # ISO date string or None if unparseable
    end_date: Optional[str] = None
    is_current: bool = False
    description: Optional[str] = None


class EducationEntry(BaseModel):
    institution: Optional[str] = None
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    grade: Optional[str] = None


class MatchedSkill(BaseModel):
    skill_id: str
    name: str
    category_name: str
    proficiency: str  # BEGINNER | INTERMEDIATE | ADVANCED | EXPERT | UNKNOWN
    years_of_use: Optional[float] = None
    mention_count: int = 1
    source_context: Optional[str] = None
    match_confidence: float  # 0-1, fuzzy match score normalized


class CertificationEntry(BaseModel):
    name: str
    issuer: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    credential_id: Optional[str] = None


class ProjectEntry(BaseModel):
    name: str
    description: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)
    url: Optional[str] = None


class LanguageEntry(BaseModel):
    name: str
    proficiency: Optional[str] = None  # e.g. "Native", "Fluent", "Conversational" — as stated on the resume


class AwardEntry(BaseModel):
    title: str
    issuer: Optional[str] = None
    date: Optional[str] = None
    description: Optional[str] = None


class PublicationEntry(BaseModel):
    title: str
    publisher: Optional[str] = None
    date: Optional[str] = None
    url: Optional[str] = None


class AtsIssue(BaseModel):
    severity: str  # "critical" | "warning" | "info"
    message: str


class CareerInsights(BaseModel):
    """Career-pattern analysis derived from the parsed experience timeline —
    the kind of thing a human recruiter would notice at a glance."""
    employment_gaps: List[str] = Field(default_factory=list)  # human-readable descriptions, e.g. "8 month gap between Acme Corp and Beta Inc (Mar 2020 - Nov 2020)"
    average_tenure_years: Optional[float] = None
    job_count_last_5_years: Optional[int] = None
    shows_job_hopping_pattern: bool = False  # average tenure < 1 year across 3+ roles
    shows_career_progression: bool = False  # seniority keywords trend upward across roles in chronological order


class ExtractionResult(BaseModel):
    engine: str = "FALLBACK_WORKER"
    raw_text: str
    contact: ContactInfo
    location: LocationInfo
    headline: Optional[str] = None
    summary: Optional[str] = None
    total_experience_years: Optional[float] = None
    experiences: List[ExperienceEntry] = Field(default_factory=list)
    educations: List[EducationEntry] = Field(default_factory=list)
    skills: List[MatchedSkill] = Field(default_factory=list)
    certifications: List[CertificationEntry] = Field(default_factory=list)
    projects: List[ProjectEntry] = Field(default_factory=list)
    languages: List[LanguageEntry] = Field(default_factory=list)
    awards: List[AwardEntry] = Field(default_factory=list)
    publications: List[PublicationEntry] = Field(default_factory=list)
    detected_language: Optional[str] = None  # ISO 639-1 code of the language the resume itself is written in
    ats_issues: List[AtsIssue] = Field(default_factory=list)
    career_insights: Optional[CareerInsights] = None
    confidence_score: float  # overall 0-1 confidence in this extraction
    field_confidence: dict = Field(default_factory=dict)  # per-field confidence, e.g. {"name": 0.9, "location": 0.6}
    warnings: List[str] = Field(default_factory=list)
