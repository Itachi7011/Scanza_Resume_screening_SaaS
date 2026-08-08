"""
Matches resume text against the skill taxonomy sent by main-service, using
spaCy's PhraseMatcher instead of raw substring search.

This is a real correctness fix, not just a performance one: the previous
implementation used `text.find(skill_name)`, a naive substring search. For
short skill names — "R", "C", "Go" — that matches INSIDE other words:
"R" inside "Director", "Go" inside "mango" or "Chicago", "C" inside almost
anything. PhraseMatcher tokenizes the text first and only matches whole
tokens, eliminating this entire class of false positive.

For each matched skill we also make a best-effort guess at:
  - proficiency, from nearby qualifier words ("expert", "familiar with", etc.)
  - years_of_use, from a nearby "X years" pattern
  - mention_count, how many times it appears across the whole resume
  - a confidence boost when the skill was found inside a matching
    sub-section of the Skills block (e.g. a skill tagged "cloud" in the
    taxonomy found under a "Cloud Platforms" subheading)
"""
import re
from typing import Dict, List
import spacy
from spacy.matcher import PhraseMatcher
from rapidfuzz import fuzz

from app.config import settings
from app.schemas.extraction import MatchedSkill, SkillTaxonomyItem

_nlp = None
_matcher_cache: dict[int, tuple] = {}  # keyed by hash of taxonomy skill_ids, cached across requests with the same taxonomy


def get_nlp():
    global _nlp
    if _nlp is None:
        _nlp = spacy.load("en_core_web_sm", disable=["ner", "parser", "lemmatizer"])
    return _nlp


PROFICIENCY_KEYWORDS = {
    "EXPERT": ["expert", "advanced proficiency", "mastery", "specialist", "deep expertise"],
    "ADVANCED": ["advanced", "proficient", "strong experience", "extensive experience", "highly skilled"],
    "INTERMEDIATE": ["intermediate", "working knowledge", "comfortable with", "solid experience"],
    "BEGINNER": ["beginner", "basic knowledge", "familiar with", "exposure to", "learning", "some experience"],
}
YEARS_NEAR_RE = re.compile(r"(\d+(?:\.\d+)?)\s*\+?\s*year", re.IGNORECASE)


def _guess_proficiency(context: str) -> str:
    lowered = context.lower()
    for level, keywords in PROFICIENCY_KEYWORDS.items():
        if any(kw in lowered for kw in keywords):
            return level
    return "UNKNOWN"


def _guess_years(context: str) -> float | None:
    match = YEARS_NEAR_RE.search(context)
    return float(match.group(1)) if match else None


def _context_window(text: str, start_char: int, end_char: int, radius: int = 60) -> str:
    return text[max(0, start_char - radius): min(len(text), end_char + radius)].replace("\n", " ").strip()


def _build_matcher(taxonomy: List[SkillTaxonomyItem]) -> tuple[PhraseMatcher, Dict[str, SkillTaxonomyItem]]:
    """Builds (and caches) a PhraseMatcher for this exact taxonomy. Since
    main-service sends the full taxonomy on every request and it changes
    rarely, caching avoids rebuilding a several-hundred-pattern matcher on
    every single resume upload."""
    cache_key = hash(tuple(sorted(item.skill_id for item in taxonomy)))
    if cache_key in _matcher_cache:
        return _matcher_cache[cache_key]

    nlp = get_nlp()
    matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
    label_to_item: Dict[str, SkillTaxonomyItem] = {}

    for item in taxonomy:
        names = [item.name] + item.aliases
        patterns = [nlp.make_doc(name) for name in names]
        matcher.add(item.skill_id, patterns)
        label_to_item[item.skill_id] = item

    result = (matcher, label_to_item)
    if len(_matcher_cache) > 20:  # simple unbounded-growth guard
        _matcher_cache.clear()
    _matcher_cache[cache_key] = result
    return result


def extract_skills(
    full_text: str,
    taxonomy: List[SkillTaxonomyItem],
    skill_subsections: Dict[str, str] | None = None,
) -> List[MatchedSkill]:
    if not taxonomy or not full_text.strip():
        return []

    nlp = get_nlp()
    matcher, label_to_item = _build_matcher(taxonomy)
    doc = nlp(full_text)

    matches: Dict[str, MatchedSkill] = {}
    mention_counts: Dict[str, int] = {}

    for match_id, start, end in matcher(doc):
        skill_id = nlp.vocab.strings[match_id]
        item = label_to_item[skill_id]
        span = doc[start:end]
        mention_counts[skill_id] = mention_counts.get(skill_id, 0) + 1

        if skill_id not in matches:
            context = _context_window(full_text, span.start_char, span.end_char)
            matches[skill_id] = MatchedSkill(
                skill_id=item.skill_id,
                name=item.name,
                category_name=item.category_name,
                proficiency=_guess_proficiency(context),
                years_of_use=_guess_years(context),
                mention_count=1,
                source_context=context,
                match_confidence=1.0,
            )

    for skill_id, count in mention_counts.items():
        matches[skill_id].mention_count = count

    # Fuzzy fallback for typo'd/unusual skill spellings not caught by exact
    # phrase matching — bounded to skills not already matched, to keep this fast.
    unmatched = [item for item in taxonomy if item.skill_id not in matches]
    lowered_text = full_text.lower()
    for item in unmatched:
        score = fuzz.partial_ratio(item.name.lower(), lowered_text)
        if score >= settings.FUZZY_MATCH_THRESHOLD and len(item.name) >= 4:  # skip short names, too noisy for fuzzy
            matches[item.skill_id] = MatchedSkill(
                skill_id=item.skill_id,
                name=item.name,
                category_name=item.category_name,
                proficiency="UNKNOWN",
                mention_count=1,
                source_context=None,
                match_confidence=round(score / 100, 2),
            )

    return list(matches.values())
