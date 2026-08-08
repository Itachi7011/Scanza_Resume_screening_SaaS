"""
Flags resume-formatting issues that commonly cause real-world ATS systems
(Workday, Taleo, Greenhouse, etc.) to mis-parse or drop a resume entirely.
This is intentionally pattern-level, explainable feedback — the same kind
of thing a career coach would flag by eye — not a mysterious score.
"""
import re
from typing import Dict, List
from app.schemas.extraction import AtsIssue, ContactInfo

WORD_COUNT_TOO_SHORT = 120
WORD_COUNT_TOO_LONG = 1100


def analyze_ats_friendliness(
    raw_text: str,
    sections: Dict[str, str],
    contact: ContactInfo,
    extraction_warnings: List[str],
) -> List[AtsIssue]:
    issues: List[AtsIssue] = []
    word_count = len(raw_text.split())

    if not contact.email:
        issues.append(AtsIssue(severity="critical", message="No email address could be detected — many ATS systems reject applications without one."))
    if not contact.phone:
        issues.append(AtsIssue(severity="warning", message="No phone number could be detected."))

    has_experience = bool(sections.get("experience", "").strip())
    has_education = bool(sections.get("education", "").strip())
    has_skills = bool(sections.get("skills", "").strip())

    if not has_experience:
        issues.append(AtsIssue(severity="critical", message="No 'Experience' section was detected — ensure it uses a standard heading like 'Experience' or 'Work Experience'."))
    if not has_education:
        issues.append(AtsIssue(severity="warning", message="No 'Education' section was detected."))
    if not has_skills:
        issues.append(AtsIssue(severity="warning", message="No 'Skills' section was detected — a dedicated skills section helps both ATS keyword matching and human skimming."))

    if word_count < WORD_COUNT_TOO_SHORT:
        issues.append(AtsIssue(severity="warning", message=f"This resume is quite short ({word_count} words) — ATS systems and recruiters may read this as incomplete."))
    elif word_count > WORD_COUNT_TOO_LONG:
        issues.append(AtsIssue(severity="info", message=f"This resume is fairly long ({word_count} words) — consider tightening it to 1-2 pages for most roles."))

    if any("scanned/image-only" in w or "OCR" in w for w in extraction_warnings):
        issues.append(AtsIssue(severity="critical", message="This appears to be a scanned image rather than a native-text PDF — most ATS systems cannot read scanned resumes at all. Export directly from a word processor instead."))

    # A high ratio of " | " separators or leaked table pipe characters is a
    # strong signal the source document used a table/columns for layout,
    # which many ATS parsers mangle badly. A couple of pipes in the contact
    # line ("email | phone | linkedin") is completely normal, so this
    # requires BOTH a meaningful ratio AND a minimum absolute count before
    # flagging — avoids a false positive on every resume with a piped
    # contact header.
    pipe_count = raw_text.count(" | ")
    pipe_ratio = pipe_count / max(word_count, 1)
    if pipe_count >= 6 and pipe_ratio > 0.03:
        issues.append(AtsIssue(severity="warning", message="This resume appears to use tables or a multi-column layout, which some ATS systems parse incorrectly. A single-column layout is safest."))

    # Heavy use of non-ASCII decorative characters (icons rendered as text, etc.)
    non_ascii_ratio = sum(1 for ch in raw_text if ord(ch) > 0x2000) / max(len(raw_text), 1)
    if non_ascii_ratio > 0.01:
        issues.append(AtsIssue(severity="info", message="Decorative icons or special characters were detected — some ATS systems render these as garbled text or strip them entirely."))

    if not issues:
        issues.append(AtsIssue(severity="info", message="No major ATS-formatting issues detected — this resume should parse cleanly in most systems."))

    return issues
