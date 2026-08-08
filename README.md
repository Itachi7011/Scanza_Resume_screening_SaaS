# Scanza — AI-Powered Resume Screening SaaS

Scanza parses resumes (PDF/DOCX), extracts structured data (contact info, location,
categorized skills, experience, education), scores resume quality, and gives
improvement suggestions. It's usable directly on scanza.dev, and as an embeddable
SaaS via API keys for client companies (Greenhouse-style integration).

## Monorepo layout

```
scanza/
├── frontend/                # Next.js 14 (App Router) + TypeScript — UI, and the
│                             # ONLY place that talks to the browser. Uses
│                             # next.config.js rewrites to proxy /api/auth/* and
│                             # /api/app/* to the two backend services (like your
│                             # vite proxy example) — no separate CORS-facing API
│                             # layer for the browser to worry about.
│
├── services/
│   ├── auth-service/         # Node + Express + TS. ONLY handles: signup, login,
│   │                          # OTP/email verification, password reset, JWT
│   │                          # issuing/refresh, RBAC, admin auth.
│   │
│   ├── main-service/         # Node + Express + TS. Everything else: resume
│   │   │                      # upload (Cloudinary), orchestrating the extractor
│   │   │                      # (Claude API → falls back to resume-worker),
│   │   │                      # skills DB, scoring, client/API-key management,
│   │   │                      # Socket.IO realtime notifications, admin data APIs.
│   │
│   └── resume-worker/        # Python + FastAPI. Stateless offline extraction
│                              # engine used when no LLM API key is configured.
│                              # This is the "very very powerful" fallback parser.
│
├── packages/
│   └── database/              # Single shared Prisma schema + generated client,
│                                # imported by both Node services (npm workspace).
│                                # Postgres is the only datastore.
│
├── docs/                      # SaaS integration docs (API key usage, webhooks)
└── docker-compose.yml         # Spins up auth-service, main-service, resume-worker
                                 # (Postgres is remote — not containerized)
```

## Why this split works with "no separate API system"

Next.js's `next.config.js` supports `rewrites()`, which behaves like your Vite
proxy example. In development and production alike, the browser only ever talks
to the Next.js origin; Next.js transparently forwards requests to whichever
backend service owns that route. You'll see this wired up in Phase 5.

## Build phases (for tracking — see chat for status)
1. Foundation: monorepo, Prisma schema, Docker, env files ✅
2. auth-service ✅
3. resume-worker (Python) ✅ — upgraded with OCR, 34k+ city database, spaCy PhraseMatcher skill matching, certifications/projects/languages/awards/publications extraction, ATS analysis, career insights
4. main-service ✅ — includes job-description matching, job postings + candidate ranking, team invites, Stripe billing (with graceful fallback)
5. Next.js frontend ✅
6. Admin panel ✅
7. Docs, SEO, packaging ✅

## Feature highlights beyond the original spec
- **Resume-to-job-description matching** — paste a JD, get a match score plus exactly which taxonomy skills are matched vs. missing (`/dashboard/resumes/:id`, powered by `matching.service.ts`)
- **Job Postings + candidate ranking** — clients create a posting, submitted resumes get automatically scored and ranked (`/dashboard/client/job-postings`)
- **Team invites** — `CLIENT_OWNER`s can invite teammates into their workspace (`/dashboard/client/team`)
- **Billing** — Stripe checkout when configured, graceful manual-follow-up fallback when not (`/dashboard/client/billing`)
- **ATS-friendliness report + career insights** (employment gaps, job-hopping pattern, career progression) surfaced directly in the resume results view
