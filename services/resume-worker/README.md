# Scanza Resume Worker

Stateless FastAPI service that performs **offline resume extraction** —
no LLM API key required. This is what `main-service` calls when
`ANTHROPIC_API_KEY` is not configured (or a Claude API call fails), so the
whole pipeline keeps working with zero paid dependencies.

## How it works

```
file bytes ──► text_extraction.py   (pdfplumber → PyMuPDF fallback chain)
                    │
                    ▼
             section_detector.py    (splits into Summary/Experience/Education/Skills/...)
                    │
        ┌───────────┼──────────────┬──────────────┬─────────────┐
        ▼           ▼              ▼              ▼             ▼
  contact_extractor location_    experience_    education_    skills_
  (name/email/      extractor    extractor      extractor     extractor
   phone/links)     (country/                                 (fuzzy-matches
                     state/city)                               against the
                                                                 taxonomy sent
                                                                 by main-service)
        └───────────┴──────────────┴──────────────┴─────────────┘
                              │
                              ▼
                    pipeline.py combines everything
                    into one ExtractionResult + a
                    self-explainable confidence_score
```

## Run locally

```bash
cd services/resume-worker
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cp .env.example .env
uvicorn main:app --reload --port 8000
```

Then: `curl -F "file=@resume.pdf" -F 'skills_taxonomy=[]' http://localhost:8000/extract`

## Known limitations (by design, not oversight)

- **City database is curated, not exhaustive** (`app/data/cities.json`, ~90
  major cities). Resumes stating an uncommon city will fall back to
  country-only detection. Easy upgrade path: replace with the free GeoNames
  `cities15000.txt` dataset (15,000+ cities) — same matching code works
  unchanged, just point `_CITIES_PATH` at the new file.
- **Section detection is heading-based**, so resumes with no clear section
  headings (rare, but exists) will have everything land in `header`/one
  bucket. Claude API (the primary engine) handles these far better, which
  is exactly why it's tried first when available.
- **Experience/education date parsing** handles the common "Month Year –
  Month Year" and "Month Year – Present" formats plus bare years. Highly
  unusual date formats may parse as `null` rather than guess wrong.

## Testing

`tests/` uses the sample resumes to validate extraction accuracy without
needing spaCy's model download for every CI run — see `tests/fixtures/`.
