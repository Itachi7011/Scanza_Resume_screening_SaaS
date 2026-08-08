"""
Parses the "projects" section. Similar block structure to experience
(a header line, then bullet description lines), but projects commonly also
list a tech stack inline ("Built with: React, Node.js, PostgreSQL") and a
URL (GitHub/live demo link) — both extracted here.
"""
import re
from typing import List
from app.schemas.extraction import ProjectEntry
from app.utils.patterns import GENERIC_URL_RE, GITHUB_RE, is_plausible_url

TECH_LINE_RE = re.compile(r"(?:built\s+with|tech\s*stack|technologies|stack)\s*[:\-]\s*(.+)", re.IGNORECASE)


def _is_bullet(line: str) -> bool:
    return bool(re.match(r"^[•\-\*\u2022]\s*", line))


def extract_projects(section_text: str) -> List[ProjectEntry]:
    if not section_text.strip():
        return []

    lines = [l for l in section_text.split("\n") if l.strip()]
    entries: List[ProjectEntry] = []
    current_name = None
    current_desc_lines: List[str] = []
    current_tech: List[str] = []
    current_url = None

    def flush():
        nonlocal current_name, current_desc_lines, current_tech, current_url
        if current_name:
            entries.append(ProjectEntry(
                name=current_name,
                description="\n".join(current_desc_lines).strip() or None,
                technologies=current_tech,
                url=current_url,
            ))
        current_name, current_desc_lines, current_tech, current_url = None, [], [], None

    for line in lines:
        # Tech-stack lines are checked FIRST, before the "new project" length
        # heuristic — a short line like "Built with: React, Node.js" would
        # otherwise be misread as the start of a brand new project.
        tech_match = TECH_LINE_RE.search(line)
        if tech_match:
            current_tech = [t.strip() for t in re.split(r",|/|\u2022", tech_match.group(1)) if t.strip()]
            continue

        # A line that's ENTIRELY a URL (very common: the repo/demo link on
        # its own line) is also checked before the length heuristic — a
        # bare URL is short (often just one "word"), so without this it
        # gets misread as a new project's name instead of attached to the
        # project it belongs to.
        stripped_line = line.strip()
        gh_whole_line = GITHUB_RE.fullmatch(stripped_line) or GITHUB_RE.match(stripped_line)
        if current_name and (gh_whole_line or (is_plausible_url(stripped_line) and GENERIC_URL_RE.fullmatch(stripped_line))):
            current_url = current_url or stripped_line
            continue

        if not _is_bullet(line) and len(line.split()) <= 8:
            flush()
            current_name = re.sub(r"\s*[:\-–—]\s*$", "", line.strip())
            url_match = GENERIC_URL_RE.search(line)
            if url_match and is_plausible_url(url_match.group(0)):
                current_url = url_match.group(0)
                current_name = current_name.replace(current_url, "").strip(" -–—|")
            continue

        gh = GITHUB_RE.search(line)
        if gh and not current_url:
            current_url = gh.group(0)

        current_desc_lines.append(re.sub(r"^[•\-\*\u2022]\s*", "", line))

    flush()
    return entries
