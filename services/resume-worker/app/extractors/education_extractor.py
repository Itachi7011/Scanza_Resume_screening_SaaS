"""
Parses the "education" section into individual entries. Same date-range-as-
delimiter strategy as experience_extractor, plus a small dictionary of
common degree keywords to separate "degree" from "institution" when they're
on the same line (e.g. "B.Tech in Computer Science, IIT Delhi").
"""
import re
from typing import List
from app.schemas.extraction import EducationEntry
from app.utils.dates import extract_date_range, DATE_RANGE_RE

DEGREE_KEYWORDS = [
    "bachelor", "master", "b.tech", "m.tech", "b.sc", "m.sc", "bsc", "msc",
    "phd", "ph.d", "mba", "bba", "b.e.", "m.e.", "associate degree",
    "high school diploma", "diploma", "b.a.", "m.a.",
]

GRADE_RE = re.compile(r"(GPA|CGPA|Grade)\s*[:\-]?\s*([\d.]+\s*/?\s*[\d.]*)", re.IGNORECASE)


def _split_degree_institution(header_line: str) -> tuple[str | None, str | None, str | None]:
    cleaned = DATE_RANGE_RE.sub("", header_line).strip(" -–—|,")
    lowered = cleaned.lower()

    degree = None
    for kw in DEGREE_KEYWORDS:
        if kw in lowered:
            idx = lowered.find(kw)
            degree = cleaned[idx: idx + 60].split(",")[0].strip()
            break

    institution = None
    for sep in [",", " - ", " – ", " at "]:
        if sep in cleaned:
            parts = [p.strip() for p in cleaned.split(sep)]
            # institution is whichever part ISN'T the degree text
            institution = next((p for p in parts if p and p != degree), None)
            break

    field_of_study = None
    if degree and " in " in degree.lower():
        field_of_study = degree.lower().split(" in ", 1)[1].strip().title()

    return degree or (cleaned if not institution else None), institution, field_of_study


def _is_bullet(line: str) -> bool:
    return bool(re.match(r"^[•\-\*\u2022]\s*", line))


def _find_entry_starts(lines: List[str]) -> List[int]:
    """Same two-line-header handling as experience_extractor: a degree line
    ("B.Tech in Computer Science, IIT Delhi") is very often followed by a
    SEPARATE date-only line ("Aug 2014 - May 2018") rather than having the
    date inline. Without absorbing that date line into the same entry, it
    gets mis-parsed as its own empty entry."""
    starts: List[int] = []
    skip_next = False

    for idx, line in enumerate(lines):
        if skip_next:
            skip_next = False
            continue
        if _is_bullet(line):
            continue

        has_date = bool(DATE_RANGE_RE.search(line))
        has_degree_kw = any(kw in line.lower() for kw in DEGREE_KEYWORDS)
        next_line = lines[idx + 1] if idx + 1 < len(lines) else ""
        next_is_date_only = (
            not _is_bullet(next_line)
            and bool(DATE_RANGE_RE.search(next_line))
            and len(next_line.split()) <= 6
        )

        if has_date or has_degree_kw or next_is_date_only:
            starts.append(idx)
            if next_is_date_only and not has_date:
                skip_next = True

    return starts


def extract_education(section_text: str) -> List[EducationEntry]:
    if not section_text.strip():
        return []

    lines = [l for l in section_text.split("\n") if l.strip()]
    start_indices = _find_entry_starts(lines)
    if not start_indices:
        return []

    boundaries = start_indices + [len(lines)]
    entries: List[EducationEntry] = []

    for k in range(len(boundaries) - 1):
        block = lines[boundaries[k]: boundaries[k + 1]]

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
        extra_lines = block[desc_start:]

        degree, institution, field = _split_degree_institution(header_line)
        start, end, _ = extract_date_range(header_line)
        grade_match = GRADE_RE.search(header_line + " " + " ".join(extra_lines))

        entries.append(
            EducationEntry(
                degree=degree,
                institution=institution,
                field_of_study=field,
                start_date=start,
                end_date=end,
                grade=grade_match.group(2).strip() if grade_match else None,
            )
        )

    return entries
