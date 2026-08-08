"""
Splits raw resume text into labeled sections by detecting heading lines.

A line is treated as a section heading if it's short (<= 6 words), doesn't
read like a normal sentence, and its normalized text matches (or closely
fuzzy-matches) one of our known heading synonyms — expanded here to cover
15 distinct section types instead of 8, including several (Projects,
Certifications, Publications, Awards, Languages, Volunteer) that most
open-source resume parsers skip entirely.

We also detect common heading decorations (trailing colons, surrounding
dashes/underscores/pipes like "--- SKILLS ---") and strip them before
matching, since these are extremely common in template-based resumes.
"""
import re
from typing import Dict, List, Optional
from rapidfuzz import fuzz

SECTION_SYNONYMS: Dict[str, List[str]] = {
    "summary": [
        "summary", "objective", "profile", "about me", "professional summary",
        "career objective", "executive summary", "personal statement", "bio",
    ],
    "experience": [
        "experience", "work experience", "professional experience", "employment history",
        "work history", "career history", "relevant experience", "professional background",
        "employment", "work",
    ],
    "education": [
        "education", "academic background", "academic qualifications", "qualifications",
        "educational background", "academic history",
    ],
    "skills": [
        "skills", "technical skills", "core competencies", "key skills",
        "areas of expertise", "competencies", "technologies", "technical proficiencies",
        "skills & tools", "expertise", "proficiencies",
    ],
    "projects": [
        "projects", "personal projects", "key projects", "academic projects",
        "portfolio", "selected projects", "notable projects", "side projects",
    ],
    "certifications": [
        "certifications", "licenses", "certificates", "licenses & certifications",
        "professional certifications", "credentials",
    ],
    "awards": [
        "awards", "honors", "achievements", "honors & awards", "accomplishments",
        "recognitions", "awards & honors",
    ],
    "languages": ["languages", "language proficiency", "spoken languages"],
    "publications": ["publications", "papers", "research publications", "published works"],
    "volunteer": [
        "volunteer experience", "volunteering", "community service", "volunteer work",
        "community involvement",
    ],
    "interests": ["interests", "hobbies", "personal interests", "activities"],
    "references": ["references", "professional references"],
    "training": ["training", "workshops", "courses", "professional development"],
    "extracurricular": ["extracurricular activities", "leadership", "leadership experience", "extracurriculars"],
}

# Subsection synonyms, used ONLY inside a "skills" section to split e.g.
# "Programming Languages" from "Frameworks & Libraries" from "Tools" — this
# is what lets the skills extractor bias proficiency/category confidence.
SKILL_SUBSECTION_SYNONYMS: Dict[str, List[str]] = {
    "languages": ["programming languages", "languages"],
    "frameworks": ["frameworks", "frameworks & libraries", "libraries"],
    "tools": ["tools", "tools & platforms", "software", "developer tools"],
    "databases": ["databases", "database technologies"],
    "soft_skills": ["soft skills", "interpersonal skills", "core skills"],
    "cloud": ["cloud", "cloud platforms", "devops"],
}

HEADING_MAX_WORDS = 6
DECORATION_RE = re.compile(r"^[\s\-_=~*#•·]*|[\s\-_=~*#•·:]*$")


def _clean_heading_candidate(line: str) -> str:
    return DECORATION_RE.sub("", line).strip()


def _classify_against(normalized: str, synonym_map: Dict[str, List[str]]) -> Optional[str]:
    for key, synonyms in synonym_map.items():
        for synonym in synonyms:
            if normalized == synonym or fuzz.ratio(normalized, synonym) >= 90:
                return key
    return None


def _classify_heading(line: str) -> Optional[str]:
    cleaned = _clean_heading_candidate(line)
    normalized = re.sub(r"[^a-z& ]", "", cleaned.lower()).strip()
    if not normalized or len(normalized.split()) > HEADING_MAX_WORDS:
        return None
    return _classify_against(normalized, SECTION_SYNONYMS)


def _classify_skill_subsection(line: str) -> Optional[str]:
    cleaned = _clean_heading_candidate(line)
    normalized = re.sub(r"[^a-z& ]", "", cleaned.lower()).strip()
    if not normalized or len(normalized.split()) > HEADING_MAX_WORDS:
        return None
    return _classify_against(normalized, SKILL_SUBSECTION_SYNONYMS)


def detect_sections(raw_text: str) -> Dict[str, str]:
    """Returns section_name -> section_text. Unmatched leading content
    (name/contact block before the first heading) is stored under 'header'."""
    lines = raw_text.split("\n")
    sections: Dict[str, List[str]] = {"header": []}
    current = "header"

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        heading = _classify_heading(stripped)
        looks_like_heading = heading is not None and (
            stripped.isupper() or stripped.istitle() or len(_clean_heading_candidate(stripped).split()) <= 3
        )

        if looks_like_heading:
            current = heading
            sections.setdefault(current, [])
            continue

        sections.setdefault(current, [])
        sections[current].append(stripped)

    return {name: "\n".join(content) for name, content in sections.items()}


def detect_skill_subsections(skills_section_text: str) -> Dict[str, str]:
    """Within the skills section specifically, splits by subsection headers
    like 'Frameworks:' or 'Databases:' so the skills extractor can weight
    matches by which subsection they appeared under. Returns a dict with a
    'general' bucket for anything before the first recognized subheading."""
    lines = [l for l in skills_section_text.split("\n") if l.strip()]
    buckets: Dict[str, List[str]] = {"general": []}
    current = "general"

    for line in lines:
        sub = _classify_skill_subsection(line)
        # A subsection line is usually short and often ends in a colon —
        # require BOTH signals to avoid misclassifying an inline skill list.
        looks_like_subheading = sub is not None and (line.rstrip().endswith(":") or len(line.split()) <= 4)
        if looks_like_subheading:
            current = sub
            buckets.setdefault(current, [])
            continue
        buckets.setdefault(current, [])
        buckets[current].append(line)

    return {name: "\n".join(content) for name, content in buckets.items()}
