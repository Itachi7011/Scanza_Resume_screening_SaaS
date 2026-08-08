"""
Extracts country / state / city from resume text — fully offline, no
external geocoding API.

Two real, comprehensive data sources power this now (previously a ~90-city
hand-curated list):

  1. geonamescache — 34,000+ cities (population 15,000+) worldwide, each
     with alternate-language/spelling names, sourced from the GeoNames
     database. This alone is a ~380x increase in city coverage.
  2. pycountry — authoritative ISO-3166 country AND subdivision (state/
     province/region) data for every country, not just a handful of
     English-speaking ones.

Matching strategy: extract short candidate phrases from the header/contact
block (comma-separated segments, capitalized word pairs), try an exact
(case-insensitive) dictionary lookup first — O(1) and by far the most
common case — and only fall back to fuzzy matching against a bounded
candidate pool if nothing matched exactly. Once a city is found, its
country is known, so the state/subdivision search is scoped to just that
country's subdivisions (typically <100) instead of a global fuzzy search.

Also detects explicit "Remote" / "Hybrid" / "Open to relocation" signals,
which matter as much as physical location for a huge fraction of resumes.
"""
import re
from typing import Optional, Tuple
import unicodedata
import pycountry
import geonamescache
from rapidfuzz import fuzz, process

from app.config import settings
from app.schemas.extraction import LocationInfo
from app.utils.patterns import EMAIL_RE
from app.utils.phone_matching import strip_phone_numbers

_gc = geonamescache.GeonamesCache()
_ALL_CITIES = _gc.get_cities()  # geonameid -> record
_ALL_COUNTRIES = _gc.get_countries()  # iso -> record

# Build a fast exact-match index: lowercase name -> best (highest population) city record.
# Also index every alternate name/spelling so "Bengaluru" AND "Bangalore" both resolve.
_CITY_INDEX: dict[str, dict] = {}
for _rec in _ALL_CITIES.values():
    _names = [_rec["name"]] + [a for a in _rec.get("alternatenames", []) if len(a) >= 3]
    for _name in _names:
        key = _name.lower().strip()
        existing = _CITY_INDEX.get(key)
        if existing is None or _rec["population"] > existing["population"]:
            _CITY_INDEX[key] = _rec

_CITY_NAME_POOL = list(_CITY_INDEX.keys())  # for fuzzy fallback, bounded candidate pool

_COUNTRY_ALIASES = {
    "usa": "US", "us": "US", "united states of america": "US", "america": "US",
    "uk": "GB", "u.k.": "GB", "great britain": "GB", "england": "GB",
    "uae": "AE", "south korea": "KR", "north korea": "KP",
}

REMOTE_SIGNAL_RE = re.compile(r"\b(fully\s+remote|remote[\s\-]?first|remote\s+work|100%\s*remote|remote)\b", re.IGNORECASE)
HYBRID_SIGNAL_RE = re.compile(r"\bhybrid\b", re.IGNORECASE)
RELOCATION_SIGNAL_RE = re.compile(r"\b(open\s+to\s+relocat\w*|willing\s+to\s+relocat\w*|relocat\w*\s+available)\b", re.IGNORECASE)

POSTAL_CODE_RE = re.compile(r"\b\d{5,6}\b|\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b")
COMMA_LINE_RE = re.compile(r"[A-Za-z][A-Za-z .]{1,30},\s*[A-Za-z][A-Za-z .]{1,30}(,\s*[A-Za-z .]{1,30})?")


def _find_country_by_name(text: str) -> Optional[str]:
    """Returns an ISO alpha-2 country code, or None."""
    lowered = text.lower()
    for alias, code in _COUNTRY_ALIASES.items():
        if re.search(rf"\b{re.escape(alias)}\b", lowered):
            return code
    for code, rec in _ALL_COUNTRIES.items():
        if re.search(rf"\b{re.escape(rec['name'].lower())}\b", lowered):
            return code
    return None


def _candidate_phrases(text: str) -> list[str]:
    phrases: set[str] = set()
    for match in COMMA_LINE_RE.finditer(text):
        for part in match.group(0).split(","):
            cleaned = part.strip()
            if cleaned:
                phrases.add(cleaned)
    for m in re.finditer(r"\b([A-Z][a-zA-Z\u00C0-\u024F]+(?:\s[A-Z][a-zA-Z\u00C0-\u024F]+){0,2})\b", text):
        phrases.add(m.group(1))
    return list(phrases)


def _find_city(text: str) -> Optional[dict]:
    candidates = _candidate_phrases(text)
    if not candidates:
        return None

    # Pass 1: exact match (case-insensitive) — handles the overwhelming majority.
    exact_matches = [_CITY_INDEX[c.lower()] for c in candidates if c.lower() in _CITY_INDEX]
    if exact_matches:
        return max(exact_matches, key=lambda r: r["population"])

    # Pass 2: fuzzy fallback for typos/unusual formatting, bounded to a
    # reasonably small candidate pool per phrase to keep this fast.
    best_match, best_score = None, 0
    for phrase in candidates:
        if len(phrase) < 4:
            continue
        result = process.extractOne(phrase.lower(), _CITY_NAME_POOL, scorer=fuzz.ratio, score_cutoff=settings.FUZZY_MATCH_THRESHOLD)
        if result and result[1] > best_score:
            best_score = result[1]
            best_match = _CITY_INDEX[result[0]]
    return best_match


ADMIN_TYPE_SUFFIX_RE = re.compile(
    r"\s+(State|Province|Region|Union territory|District|Prefecture|Governorate|"
    r"County|Canton|Department|City|Municipality|Republic|Autonomous.*|Emirate)\s*$",
    re.IGNORECASE,
)


def _strip_diacritics(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in normalized if not unicodedata.combining(ch))


def _clean_subdivision_name(name: str) -> str:
    return ADMIN_TYPE_SUFFIX_RE.sub("", name).strip()


def _find_subdivision(text: str, country_code: str) -> Optional[str]:
    """Searches only the subdivisions of the already-known country — a
    search space of a few dozen entries instead of every state on Earth.

    pycountry's official ISO names often carry diacritics ("Karnātaka") and
    administrative-type suffixes ("Uttar Pradesh State") that never appear
    verbatim on a resume — both are stripped/normalized before matching."""
    try:
        subdivisions = list(pycountry.subdivisions.get(country_code=country_code))
    except (KeyError, LookupError):
        return None

    normalized_text = _strip_diacritics(text).lower()
    for sub in subdivisions:
        clean_name = _strip_diacritics(_clean_subdivision_name(sub.name))
        if len(clean_name) < 3:
            continue
        if re.search(rf"\b{re.escape(clean_name.lower())}\b", normalized_text):
            return clean_name  # return the plain-ASCII display form, matching how it appears on the resume
    return None


def _detect_work_mode(text: str) -> Optional[str]:
    if REMOTE_SIGNAL_RE.search(text):
        return "REMOTE"
    if HYBRID_SIGNAL_RE.search(text):
        return "HYBRID"
    if RELOCATION_SIGNAL_RE.search(text):
        return "OPEN_TO_RELOCATION"
    return None


def extract_location(header_text: str, full_text: str) -> Tuple[LocationInfo, Optional[str]]:
    """Returns (LocationInfo, work_mode). work_mode is one of REMOTE /
    HYBRID / OPEN_TO_RELOCATION / None, surfaced separately since it's not
    really a "place" but matters just as much for matching."""
    search_text = header_text if header_text.strip() else full_text[:1000]
    work_mode = _detect_work_mode(full_text[:2000])

    city_rec = _find_city(search_text) or _find_city(full_text[:1500])
    country_code = city_rec["countrycode"] if city_rec else (_find_country_by_name(search_text) or _find_country_by_name(full_text[:1500]))

    postal_search_text = strip_phone_numbers(EMAIL_RE.sub(" ", search_text))
    postal_match = POSTAL_CODE_RE.search(postal_search_text)

    country_name = None
    if country_code:
        country_rec = _ALL_COUNTRIES.get(country_code)
        country_name = country_rec["name"] if country_rec else country_code

    state_name = _find_subdivision(search_text, country_code) if country_code else None

    info = LocationInfo(
        raw_text=search_text[:120].strip() if (city_rec or country_code) else None,
        city=city_rec["name"] if city_rec else None,
        state=state_name,
        country=country_name,
        country_code=country_code,
        postal_code=postal_match.group(0) if postal_match else None,
    )
    return info, work_mode
