import logging
from datetime import date
from typing import List

from app.schemas.extraction import ExtractionResult, SkillTaxonomyItem
from app.extractors.text_extraction import extract_text
from app.extractors.section_detector import detect_sections, detect_skill_subsections
from app.extractors.contact_extractor import extract_contact_info
from app.extractors.location_extractor import extract_location
from app.extractors.skills_extractor import extract_skills
from app.extractors.experience_extractor import extract_experiences
from app.extractors.education_extractor import extract_education
from app.extractors.certifications_extractor import extract_certifications
from app.extractors.projects_extractor import extract_projects
from app.extractors.languages_extractor import extract_languages
from app.extractors.awards_publications_extractor import extract_awards, extract_publications
from app.extractors.ats_analyzer import analyze_ats_friendliness
from app.extractors.career_insights import analyze_career_insights

logger = logging.getLogger("resume_worker.pipeline")


def _total_experience_years(experiences) -> float | None:
    total_days = 0
    counted_any = False
    for exp in experiences:
        if not exp.start_date:
            continue
        start = date.fromisoformat(exp.start_date)
        end = date.today() if exp.is_current or not exp.end_date else date.fromisoformat(exp.end_date)
        if end < start:
            continue
        total_days += (end - start).days
        counted_any = True
    return round(total_days / 365.25, 1) if counted_any else None


def _detect_resume_language(raw_text: str) -> str | None:
    try:
        from langdetect import detect, LangDetectException
        return detect(raw_text[:2000])
    except Exception:  # noqa: BLE001 — language detection is a nice-to-have, never fatal
        return None


def _field_confidence(contact, location, experiences, educations, skills) -> dict:
    """Per-field confidence, distinct from the overall score — lets the
    frontend/admin show exactly which fields to double-check rather than
    one opaque number for the whole extraction."""
    return {
        "name": 0.9 if contact.full_name else 0.0,
        "email": 0.95 if contact.email else 0.0,
        "phone": 0.85 if contact.phone else 0.0,
        "location": 0.85 if location.city else (0.5 if location.country else 0.0),
        "experience": min(1.0, 0.3 + 0.15 * len(experiences)) if experiences else 0.0,
        "education": min(1.0, 0.4 + 0.2 * len(educations)) if educations else 0.0,
        "skills": min(1.0, 0.2 + 0.05 * len(skills)) if skills else 0.0,
    }


def _overall_confidence(field_conf: dict, warnings: List[str]) -> float:
    values = list(field_conf.values())
    base = sum(values) / len(values) if values else 0.0
    penalty = 0.1 * min(len(warnings), 3)
    return round(max(0.0, min(1.0, base - penalty)), 2)


def run_extraction_pipeline(
    file_bytes: bytes,
    content_type: str,
    filename: str,
    skills_taxonomy: List[SkillTaxonomyItem],
) -> ExtractionResult:
    raw_text, warnings = extract_text(file_bytes, content_type, filename)

    if not raw_text.strip():
        empty_location, _ = extract_location("", "")
        return ExtractionResult(
            raw_text="",
            contact=extract_contact_info("", ""),
            location=empty_location,
            confidence_score=0.0,
            warnings=warnings or ["No text could be extracted from this file."],
        )

    sections = detect_sections(raw_text)
    header_text = sections.get("header", "")

    contact = extract_contact_info(raw_text, header_text)
    location, work_mode = extract_location(header_text, raw_text)
    location.work_mode = work_mode

    experiences = extract_experiences(sections.get("experience", ""))
    educations = extract_education(sections.get("education", ""))

    skills_section_text = sections.get("skills", "")
    skill_subsections = detect_skill_subsections(skills_section_text) if skills_section_text else None
    # Match against the FULL text (not just the Skills section) — skills are
    # very often also mentioned inline in experience bullet points, and
    # catching those repeats is what lets the scorer reward "actually used"
    # skills over "keyword-stuffed list" skills via mention_count.
    skills = extract_skills(raw_text, skills_taxonomy, skill_subsections)

    certifications = extract_certifications(sections.get("certifications", ""))
    projects = extract_projects(sections.get("projects", ""))
    languages = extract_languages(sections.get("languages", ""))
    awards = extract_awards(sections.get("awards", ""))
    publications = extract_publications(sections.get("publications", ""))

    total_years = _total_experience_years(experiences)
    detected_language = _detect_resume_language(raw_text)

    field_conf = _field_confidence(contact, location, experiences, educations, skills)
    confidence = _overall_confidence(field_conf, warnings)

    ats_issues = analyze_ats_friendliness(raw_text, sections, contact, warnings)
    career_insights = analyze_career_insights(experiences)

    header_lines = header_text.split("\n")
    headline = header_lines[1].strip() if len(header_lines) > 1 and header_lines[1].strip() else None

    return ExtractionResult(
        raw_text=raw_text,
        contact=contact,
        location=location,
        headline=headline,
        summary=sections.get("summary") or None,
        total_experience_years=total_years,
        experiences=experiences,
        educations=educations,
        skills=skills,
        certifications=certifications,
        projects=projects,
        languages=languages,
        awards=awards,
        publications=publications,
        detected_language=detected_language,
        ats_issues=ats_issues,
        career_insights=career_insights,
        confidence_score=confidence,
        field_confidence=field_conf,
        warnings=warnings,
    )
