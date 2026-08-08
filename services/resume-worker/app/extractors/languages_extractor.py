"""
Parses the "languages" section: "English (Native), Spanish - Fluent,
French: Conversational" — comma or newline separated, proficiency in
parens or after a dash/colon. Falls back to just the language name if no
proficiency is stated.
"""
import re
from typing import List
from app.schemas.extraction import LanguageEntry

PROFICIENCY_WORDS = {
    "native", "fluent", "bilingual", "professional", "conversational",
    "intermediate", "basic", "beginner", "advanced", "elementary", "proficient",
}

ENTRY_RE = re.compile(r"([A-Za-z]+)\s*[\(\-:]?\s*(" + "|".join(PROFICIENCY_WORDS) + r")?\)?", re.IGNORECASE)


def extract_languages(section_text: str) -> List[LanguageEntry]:
    if not section_text.strip():
        return []

    # Normalize newlines to commas so both "one per line" and "comma list" layouts work.
    flat = re.sub(r"[\n•\u2022]", ",", section_text)
    parts = [p.strip() for p in flat.split(",") if p.strip()]

    entries: List[LanguageEntry] = []
    seen = set()
    for part in parts:
        match = ENTRY_RE.match(part)
        if not match:
            continue
        name = match.group(1).strip().title()
        proficiency = match.group(2).strip().title() if match.group(2) else None
        if name.lower() in seen or len(name) < 2:
            continue
        seen.add(name.lower())
        entries.append(LanguageEntry(name=name, proficiency=proficiency))

    return entries
