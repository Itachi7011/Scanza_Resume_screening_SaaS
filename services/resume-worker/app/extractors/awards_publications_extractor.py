"""
Parses "awards" and "publications" sections. Both are typically one entry
per line/paragraph: "Title — Issuer/Publisher, Date". Kept as two thin
functions rather than one because their downstream schema fields differ
(publications commonly have a URL; awards commonly have a description).
"""
import re
from typing import List
from app.schemas.extraction import AwardEntry, PublicationEntry
from app.utils.dates import extract_single_date
from app.utils.patterns import GENERIC_URL_RE

SEPARATORS = [" — ", " – ", " - ", ","]


def _split_title_source(line: str) -> tuple[str, str | None]:
    for sep in SEPARATORS:
        if sep in line:
            parts = [p.strip() for p in line.split(sep, 1)]
            if len(parts) == 2 and all(parts):
                return parts[0], parts[1]
    return line.strip(), None


def extract_awards(section_text: str) -> List[AwardEntry]:
    if not section_text.strip():
        return []

    entries: List[AwardEntry] = []
    current_title = None
    current_issuer = None
    current_date = None
    current_desc: List[str] = []

    def flush():
        if current_title:
            entries.append(AwardEntry(
                title=current_title, issuer=current_issuer, date=current_date,
                description="\n".join(current_desc).strip() or None,
            ))

    for raw_line in section_text.split("\n"):
        line = re.sub(r"^[•\-\*\u2022]\s*", "", raw_line.strip())
        if not line:
            continue
        if not raw_line.strip().startswith(("-", "•", "*")) and len(line.split()) <= 12:
            flush()
            current_desc = []
            title, issuer = _split_title_source(line)
            current_date = extract_single_date(line)
            current_title = re.sub(r"\(?\b(19|20)\d{2}\b\)?", "", title).strip(" -–—,()")
            current_issuer = issuer
        else:
            current_desc.append(line)

    flush()
    return entries


def extract_publications(section_text: str) -> List[PublicationEntry]:
    if not section_text.strip():
        return []

    entries: List[PublicationEntry] = []
    for raw_line in section_text.split("\n"):
        line = re.sub(r"^[•\-\*\u2022]\s*", "", raw_line.strip())
        if not line:
            continue

        url_match = GENERIC_URL_RE.search(line)
        url = url_match.group(0) if url_match else None
        cleaned = line.replace(url, "").strip() if url else line

        date = extract_single_date(cleaned)
        title, publisher = _split_title_source(cleaned)
        title = re.sub(r"\(?\b(19|20)\d{2}\b\)?", "", title).strip(" -–—,()")

        if title:
            entries.append(PublicationEntry(title=title, publisher=publisher, date=date, url=url))

    return entries
