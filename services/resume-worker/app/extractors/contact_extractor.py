"""
Extracts name, all emails/phones found, and social/portfolio links.

Name detection combines THREE signals and picks the most confident:
  1. spaCy PERSON NER run on the header block — most reliable when it fires
     cleanly on a real name (not a company name misclassified as PERSON).
  2. Positional heuristic: the first non-empty, non-contact-info line, if
     short and title-cased — catches "NAME IN BIG FONT AT TOP", the most
     common resume layout, which spaCy sometimes misses since it's not a
     grammatical sentence.
  3. Rejection filter: candidates matching common section-header or
     job-title words ("Resume", "Curriculum Vitae", "Software Engineer")
     are discarded even if spaCy or the positional heuristic proposed them
     — this alone eliminates a large class of false positives.
"""
import re
from typing import Optional
import spacy

from app.schemas.extraction import ContactInfo
from app.utils.patterns import EMAIL_RE, LINKEDIN_RE, GITHUB_RE, GENERIC_URL_RE, is_plausible_url
from app.utils.phone_matching import find_best_phone, find_all_phones

_nlp = None


def get_nlp():
    global _nlp
    if _nlp is None:
        _nlp = spacy.load("en_core_web_sm")
    return _nlp


TWITTER_RE = re.compile(r"(https?://)?(www\.)?(twitter\.com|x\.com)/[a-zA-Z0-9_]+", re.IGNORECASE)

REJECTED_NAME_TERMS = {
    "resume", "cv", "curriculum vitae", "biodata", "profile", "personal information",
    "contact", "contact information", "portfolio", "software engineer", "developer",
    "manager", "director", "analyst", "consultant", "designer", "student", "intern",
    "objective", "summary", "about me", "career objective",
}


def _find_first(pattern: re.Pattern, text: str) -> Optional[str]:
    match = pattern.search(text)
    return match.group(0).strip() if match else None


def _find_all(pattern: re.Pattern, text: str, limit: int = 3) -> list[str]:
    seen: list[str] = []
    for m in pattern.finditer(text):
        val = m.group(0).strip()
        if val not in seen:
            seen.append(val)
        if len(seen) >= limit:
            break
    return seen


_CONTACT_LINE_DIGIT_RUN_RE = re.compile(r"\d[\d\s().-]{6,}\d")


def _looks_like_contact_line(line: str) -> bool:
    return bool(
        EMAIL_RE.search(line)
        or _CONTACT_LINE_DIGIT_RUN_RE.search(line)
        or "linkedin" in line.lower()
        or "github" in line.lower()
    )


def _is_plausible_name(candidate: str) -> bool:
    # A genuine name is always on a single line — spaCy's NER occasionally
    # spans a PERSON entity across a newline (observed with en_core_web_sm
    # 3.8.0 merging a name with the following address line, e.g.
    # "Jane Smith\nBengaluru"), which is never actually a real name.
    if "\n" in candidate or "\r" in candidate:
        return False
    words = candidate.split()
    if not (1 <= len(words) <= 4):
        return False
    if any(ch.isdigit() for ch in candidate):
        return False
    lowered = candidate.lower().strip()
    if lowered in REJECTED_NAME_TERMS:
        return False
    if any(term in lowered for term in REJECTED_NAME_TERMS):
        return False
    # Real names very rarely contain these punctuation marks
    if any(ch in candidate for ch in "@#/|:;"):
        return False
    return True


def _guess_name_heuristic(header_text: str) -> Optional[str]:
    for line in header_text.split("\n"):
        stripped = line.strip()
        if not stripped or _looks_like_contact_line(stripped):
            continue
        if not _is_plausible_name(stripped):
            continue
        if stripped.isupper():
            return stripped.title()
        if stripped.istitle() or (stripped[0].isupper() if stripped else False):
            return stripped
    return None


def _guess_name_spacy(header_text: str) -> Optional[str]:
    nlp = get_nlp()
    doc = nlp(header_text[:600])
    people = [ent.text.strip() for ent in doc.ents if ent.label_ == "PERSON" and _is_plausible_name(ent.text.strip())]
    if people:
        # Prefer the shortest plausible full name (2-3 tokens) found earliest —
        # longer PERSON spans are often name+title run together by mistake.
        candidates = sorted(people, key=len)
        return candidates[0]
    return None


def extract_contact_info(full_text: str, header_text: str) -> ContactInfo:
    emails = _find_all(EMAIL_RE, full_text, limit=3)
    phones = find_all_phones(full_text, limit=3)
    linkedin = _find_first(LINKEDIN_RE, full_text)
    github = _find_first(GITHUB_RE, full_text)
    twitter = _find_first(TWITTER_RE, full_text)

    portfolio = None
    email_free_text = EMAIL_RE.sub(" ", full_text)  # avoid matching the local-part of an email (e.g. "jane.smith" from jane.smith@email.com) as a bogus URL
    for match in GENERIC_URL_RE.finditer(email_free_text):
        url = match.group(0)
        if not is_plausible_url(url):
            continue
        if "linkedin.com" in url or "github.com" in url or "twitter.com" in url or "x.com" in url:
            continue
        if emails and any(e.split("@")[-1] in url for e in emails):
            continue
        portfolio = url
        break

    name = _guess_name_spacy(header_text) or _guess_name_heuristic(header_text)

    return ContactInfo(
        full_name=name,
        email=emails[0] if emails else None,
        phone=phones[0] if phones else None,
        linkedin_url=linkedin,
        github_url=github,
        portfolio_url=portfolio,
        all_emails=emails,
        all_phones=phones,
        twitter_url=twitter,
    )
