"""
Parses the "experience" section into individual work history entries.

Heuristic: a new entry begins on any line that contains a recognizable date
range (see utils/dates.py) — resumes overwhelmingly put dates on the same
line as, or immediately next to, the job title/company. Everything after
that line (up to the next date-range line) is treated as the bullet
description for that role.

Title/company splitting tries common separators in order: " at ", " - ",
" | ", " – ", comma. If none match, we store the whole header line as the
title and leave company null rather than guessing wrong.
"""
import re
from typing import List
from app.schemas.extraction import ExperienceEntry
from app.utils.dates import extract_date_range, DATE_RANGE_RE

SEPARATORS = [" at ", " | ", " – ", " — ", " - ", ","]

TITLE_KEYWORDS = [
    "engineer", "developer", "manager", "director", "designer", "analyst",
    "specialist", "consultant", "lead", "head of", "coordinator", "intern",
    "architect", "scientist", "officer", "executive", "president", "founder",
    "co-founder", "vp", "vice president", "administrator", "technician",
    "representative", "associate", "assistant", "supervisor", "strategist",
    "producer", "editor", "recruiter", "accountant", "attorney", "counsel",
]


def _looks_like_title(text: str) -> bool:
    lowered = text.lower()
    return any(kw in lowered for kw in TITLE_KEYWORDS)


def _split_title_company(header_line: str) -> tuple[str | None, str | None]:
    # Strip the date portion out first so it doesn't pollute the title/company split
    cleaned = DATE_RANGE_RE.sub("", header_line).strip(" -–—|,")

    for sep in SEPARATORS:
        if sep in cleaned:
            parts = [p.strip() for p in cleaned.split(sep, 1)]
            if len(parts) == 2 and parts[0] and parts[1]:
                first, second = parts
                # Don't assume title-always-comes-first — some resumes write
                # "Acme Corp - Software Engineer" instead of the reverse.
                # Whichever side contains a recognizable job-title keyword
                # wins the "title" slot; if neither/both match, keep the
                # original left-to-right order as the safest default.
                first_is_title = _looks_like_title(first)
                second_is_title = _looks_like_title(second)
                if second_is_title and not first_is_title:
                    return second, first
                return first, second

    return cleaned or None, None


def _is_bullet(line: str) -> bool:
    return bool(re.match(r"^[•\-\*\u2022]\s*", line))


def _find_entry_starts(lines: List[str]) -> List[int]:
    """
    An entry starts at a line that either:
      (a) contains a date range itself, or
      (b) is a short non-bullet line immediately followed by a line that is
          ONLY a date range — the extremely common "Title, Company" on one
          line, dates on the next line" layout.
    Case (b)'s date-only line is absorbed into the same entry, not treated
    as a second start, via the skip-next logic below.
    """
    starts: List[int] = []
    skip_next = False

    for idx, line in enumerate(lines):
        if skip_next:
            skip_next = False
            continue
        if _is_bullet(line):
            continue

        has_date = bool(DATE_RANGE_RE.search(line))
        next_line = lines[idx + 1] if idx + 1 < len(lines) else ""
        next_is_date_only = (
            not _is_bullet(next_line)
            and bool(DATE_RANGE_RE.search(next_line))
            and len(next_line.split()) <= 6
        )

        if has_date or next_is_date_only:
            starts.append(idx)
            if next_is_date_only and not has_date:
                skip_next = True  # absorb the date-only line into this entry's header

    return starts


def extract_experiences(section_text: str) -> List[ExperienceEntry]:
    if not section_text.strip():
        return []

    lines = [l for l in section_text.split("\n") if l.strip()]
    start_indices = _find_entry_starts(lines)
    if not start_indices:
        return []

    boundaries = start_indices + [len(lines)]
    entries: List[ExperienceEntry] = []

    for k in range(len(boundaries) - 1):
        block = lines[boundaries[k]: boundaries[k + 1]]

        # Header = leading non-bullet lines (usually 1, sometimes 2: title
        # line + date line). Everything after the first bullet is description.
        header_parts: List[str] = []
        desc_start = len(block)
        for j, line in enumerate(block):
            if _is_bullet(line):
                desc_start = j
                break
            header_parts.append(line)
        else:
            desc_start = len(block)

        header_line = " ".join(header_parts)
        description_lines = [re.sub(r"^[•\-\*\u2022]\s*", "", l) for l in block[desc_start:]]

        title, company = _split_title_company(header_line)
        start, end, is_current = extract_date_range(header_line)

        entries.append(
            ExperienceEntry(
                title=title,
                company=company,
                start_date=start,
                end_date=end,
                is_current=is_current,
                description="\n".join(description_lines).strip() or None,
            )
        )

    return entries
