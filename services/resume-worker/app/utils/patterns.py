"""Shared regex patterns with no heavy dependencies, so any extractor can
import these without pulling in spaCy/etc."""
import re

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")

PHONE_RE = re.compile(
    r"(\+?\d{1,3}[\s.-]?)?(\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}(?!\d)"
)

LINKEDIN_RE = re.compile(r"(https?://)?(www\.)?linkedin\.com/[a-zA-Z0-9\-_/]+", re.IGNORECASE)
GITHUB_RE = re.compile(r"(https?://)?(www\.)?github\.com/[a-zA-Z0-9\-_/]+", re.IGNORECASE)
GENERIC_URL_RE = re.compile(r"(https?://)?(www\.)?[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}(/[a-zA-Z0-9\-_./?=&]*)?")

# Whitelist of common real TLDs — used (instead of a blacklist) when a
# candidate has no "http(s)://", "www.", or path component, since a bare
# "word.word" pattern is just as often a degree abbreviation ("B.Tech",
# "M.Sc", "Ph.D") or a technology name ("Node.js") as an actual URL. A
# whitelist is far more conservative and avoids that whole false-positive class.
_COMMON_TLDS = {
    "com", "org", "net", "io", "dev", "app", "co", "me", "info", "ai",
    "xyz", "site", "online", "cloud", "software", "design",
    "portfolio", "page", "blog", "us", "uk", "in",
}

_DEGREE_ABBREVIATION_RE = re.compile(
    r"^(b|m|ph)\.?\s*(tech|sc|a|e|com|ed|phil)\.?$", re.IGNORECASE
)


def is_plausible_url(candidate: str) -> bool:
    """Filters GENERIC_URL_RE matches down to ones that are actually likely
    URLs, not a degree abbreviation (B.Tech, M.Sc, Ph.D) or a technology
    name that happens to contain a dot (Node.js, webpack.config.js)."""
    if _DEGREE_ABBREVIATION_RE.match(candidate.strip()):
        return False
    if candidate.lower().startswith(("http://", "https://", "www.")):
        return True
    if "/" in candidate:  # has a path component — much more URL-like
        return True
    suffix = candidate.rsplit(".", 1)[-1].lower()
    return suffix in _COMMON_TLDS
