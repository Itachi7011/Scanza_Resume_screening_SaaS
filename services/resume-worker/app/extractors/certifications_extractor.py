"""
Parses the "certifications" section. Certifications are usually one line
each: "Name — Issuer, Date" or "Name (Issuer) Date", sometimes with a
credential ID. We split on common separators and pull a date if present,
rather than assuming a single rigid format.
"""
import re
from typing import List
from app.schemas.extraction import CertificationEntry
from app.utils.dates import extract_single_date

CREDENTIAL_ID_RE = re.compile(r"(?:credential\s*id|id)\s*[:#]?\s*([A-Za-z0-9\-]{4,})", re.IGNORECASE)
SEPARATORS = [" — ", " – ", " - ", "|", ","]


def extract_certifications(section_text: str) -> List[CertificationEntry]:
    if not section_text.strip():
        return []

    entries: List[CertificationEntry] = []
    for line in section_text.split("\n"):
        stripped = re.sub(r"^[•\-\*\u2022]\s*", "", line.strip())
        if not stripped:
            continue

        cred_match = CREDENTIAL_ID_RE.search(stripped)
        credential_id = cred_match.group(1) if cred_match else None
        cleaned = CREDENTIAL_ID_RE.sub("", stripped).strip(" -–—,")

        issue_date = extract_single_date(cleaned)

        name, issuer = cleaned, None
        for sep in SEPARATORS:
            if sep in cleaned:
                parts = [p.strip() for p in cleaned.split(sep, 1)]
                if len(parts) == 2 and all(parts):
                    name, issuer = parts
                    break

        # Strip a trailing bare year/date from the name itself if it leaked in
        name = re.sub(r"\(?\b(19|20)\d{2}\b\)?\s*$", "", name).strip(" -–—,()")

        if name:
            entries.append(CertificationEntry(name=name, issuer=issuer, issue_date=issue_date, credential_id=credential_id))

    return entries
