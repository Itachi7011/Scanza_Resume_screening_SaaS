import re
from datetime import datetime
from typing import Optional, Tuple
from dateutil import parser as dateutil_parser

CURRENT_MARKERS = {"present", "current", "now", "ongoing", "till date", "to date"}

# Matches "Jan 2020 - Present", "01/2019 – 03/2021", "2018 - 2020", "March 2020 to June 2022"
DATE_RANGE_RE = re.compile(
    r"([A-Za-z]{3,9}\.?\s+\d{4}|\d{1,2}/\d{4}|\d{4})\s*[-–—to]{1,4}\s*"
    r"([A-Za-z]{3,9}\.?\s+\d{4}|\d{1,2}/\d{4}|\d{4}|present|current|now)",
    re.IGNORECASE,
)


def _try_parse(token: str) -> Optional[str]:
    token = token.strip()
    if not token:
        return None
    try:
        dt = dateutil_parser.parse(token, default=datetime(1, 1, 1), fuzzy=True)
        return dt.date().isoformat()
    except (ValueError, OverflowError):
        return None


SINGLE_DATE_RE = re.compile(
    r"\b([A-Za-z]{3,9}\.?\s+\d{4}|\d{1,2}/\d{4}|\b(19|20)\d{2}\b)",
)


def extract_single_date(text: str) -> Optional[str]:
    """Finds one date mention (not a range) — used for certifications,
    awards, and publications which usually have a single date, not a span."""
    match = SINGLE_DATE_RE.search(text)
    if not match:
        return None
    return _try_parse(match.group(1))


def extract_date_range(text: str) -> Tuple[Optional[str], Optional[str], bool]:
    """Returns (start_iso, end_iso, is_current). Any field may be None if unparseable."""
    match = DATE_RANGE_RE.search(text)
    if not match:
        return None, None, False

    start_raw, end_raw = match.group(1), match.group(2)
    is_current = end_raw.strip().lower() in CURRENT_MARKERS

    start_iso = _try_parse(start_raw)
    end_iso = None if is_current else _try_parse(end_raw)

    return start_iso, end_iso, is_current
