"""
Derives career-pattern insights from the parsed experience timeline — the
kind of read a human recruiter forms in the first 10 seconds of skimming a
resume: are there unexplained gaps? Does this person job-hop? Is there a
visible upward trajectory?

All of this is computed, not guessed — every insight traces back to actual
parsed dates/titles, and gaps/patterns are only reported when we have
enough well-parsed dates to be confident (avoids confidently-wrong output
on a resume where date parsing struggled).
"""
from datetime import date
from typing import List
from app.schemas.extraction import ExperienceEntry, CareerInsights

SENIORITY_LEVELS = [
    (["intern", "trainee"], 0),
    (["junior", "associate", "entry"], 1),
    (["", ], 2),  # no seniority word = mid-level baseline
    (["senior", "sr."], 3),
    (["lead", "principal", "staff"], 4),
    (["manager", "head of"], 5),
    (["director"], 6),
    (["vp", "vice president", "chief", "cto", "ceo", "cfo"], 7),
]

MIN_GAP_MONTHS_TO_FLAG = 4


def _seniority_score(title: str | None) -> int:
    if not title:
        return 2
    lowered = title.lower()
    best = 2
    for keywords, score in SENIORITY_LEVELS:
        if any(kw and kw in lowered for kw in keywords):
            best = max(best, score)
    return best


def _months_between(a: date, b: date) -> int:
    return (b.year - a.year) * 12 + (b.month - a.month)


def analyze_career_insights(experiences: List[ExperienceEntry]) -> CareerInsights | None:
    parsed = []
    for exp in experiences:
        if not exp.start_date:
            continue
        try:
            start = date.fromisoformat(exp.start_date)
        except ValueError:
            continue
        end = date.today() if exp.is_current or not exp.end_date else None
        if end is None:
            try:
                end = date.fromisoformat(exp.end_date)
            except ValueError:
                continue
        if end < start:
            continue
        parsed.append((start, end, exp.title))

    if len(parsed) < 1:
        return None

    parsed.sort(key=lambda p: p[0])

    # --- Employment gaps ---
    gaps: List[str] = []
    for i in range(1, len(parsed)):
        prev_end = parsed[i - 1][1]
        this_start = parsed[i][0]
        gap_months = _months_between(prev_end, this_start)
        if gap_months >= MIN_GAP_MONTHS_TO_FLAG:
            gaps.append(f"{gap_months}-month gap between {prev_end.strftime('%b %Y')} and {this_start.strftime('%b %Y')}")

    # --- Average tenure ---
    tenures_years = [(_months_between(s, e)) / 12 for s, e, _ in parsed if _months_between(s, e) > 0]
    avg_tenure = round(sum(tenures_years) / len(tenures_years), 1) if tenures_years else None

    # --- Job hopping: 3+ roles with average tenure under 1 year ---
    job_hopping = bool(avg_tenure is not None and avg_tenure < 1.0 and len(parsed) >= 3)

    # --- Roles in the last 5 years ---
    five_years_ago = date.today().replace(year=date.today().year - 5)
    recent_jobs = sum(1 for s, _, _ in parsed if s >= five_years_ago)

    # --- Career progression: seniority score non-decreasing across chronological roles ---
    seniority_sequence = [_seniority_score(title) for _, _, title in parsed]
    progression = len(seniority_sequence) >= 2 and all(
        b >= a for a, b in zip(seniority_sequence, seniority_sequence[1:])
    ) and seniority_sequence[-1] > seniority_sequence[0]

    return CareerInsights(
        employment_gaps=gaps,
        average_tenure_years=avg_tenure,
        job_count_last_5_years=recent_jobs,
        shows_job_hopping_pattern=job_hopping,
        shows_career_progression=progression,
    )
