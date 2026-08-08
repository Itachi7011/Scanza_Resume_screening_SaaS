# Scanza — Quickstart

Follow these steps in order. Total setup time: ~15 minutes.

## 1. Prerequisites

- Node.js 18.18+ and npm
- Python 3.11+ (for the resume-worker)
- A remote PostgreSQL database URL (Neon, Supabase, Railway, RDS — anything works). No local Postgres needed.
- A free Cloudinary account (cloudinary.com) — required, resumes are stored there.
- (Optional, can add later) A SendGrid API key and an Anthropic (Claude) API key.

## 2. Install dependencies

From the repo root (uses npm workspaces, so one install covers frontend + both Node services + the shared database package):

```bash
npm install
```

For the Python worker, separately:

```bash
cd services/resume-worker
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cd ../..
```

## 3. Set up environment files

Copy every `.env.example` to `.env` and fill in the values:

```bash
cp packages/database/.env.example packages/database/.env
cp services/auth-service/.env.example services/auth-service/.env
cp services/main-service/.env.example services/main-service/.env
cp services/resume-worker/.env.example services/resume-worker/.env
cp frontend/.env.example frontend/.env
```

**Important:**
- Put the same `DATABASE_URL` (your remote Postgres) in `packages/database/.env`, `services/auth-service/.env`, and `services/main-service/.env`.
- `JWT_ACCESS_SECRET` must be **identical** in `auth-service/.env` and `main-service/.env`. Generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
  Run it twice for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
- Fill in `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `main-service/.env`.
- Leave `SENDGRID_API_KEY` and `ANTHROPIC_API_KEY` blank for now — everything works without them (OTPs print to the console, extraction uses the offline Python worker). Add them later with zero code changes.

## 4. Set up the database

```bash
npm run db:generate   # generates the Prisma client
npm run db:migrate    # creates all tables in your remote Postgres
npm run db:seed       # seeds the skill taxonomy, a super admin login, and a demo API key
```

The seed output prints your admin login (`admin@scanza.dev` / `ChangeMe!123` by default — **change this password after first login**) and a demo API key for testing the SaaS integration.

## 5. Run everything

Open 4 terminal tabs:

```bash
# Terminal 1
npm run dev:auth

# Terminal 2
npm run dev:main

# Terminal 3
cd services/resume-worker && source venv/bin/activate && uvicorn main:app --reload --port 8000

# Terminal 4
npm run dev:frontend
```

Then open **http://localhost:3000**.

- Log in as admin at **http://localhost:3000/admin/login** with the seeded credentials.
- Upload a resume on the homepage to test the full extraction pipeline.
- Without `ANTHROPIC_API_KEY` set, watch the `main-service` terminal — you'll see a warning and then the Python worker being used instead.

## Alternative: Docker Compose

Once your `.env` files are filled in, you can run the 3 backend services in containers instead of separate terminals:

```bash
docker compose up --build
```

(The frontend still runs separately with `npm run dev:frontend` — Next.js dev mode with hot reload is a much better experience than containerizing it locally.)

## Troubleshooting

- **"JWT verification failed" errors**: your `JWT_ACCESS_SECRET` doesn't match between `auth-service` and `main-service`.
- **Resume upload fails immediately**: check your Cloudinary credentials in `main-service/.env`.
- **Extraction always uses the fallback worker even with an API key set**: double check `ANTHROPIC_MODEL` and that `resume-worker` on port 8000 is reachable as a sanity check either way.
