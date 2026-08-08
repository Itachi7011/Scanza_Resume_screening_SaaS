import json
from typing import List

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from app.config import settings
from app.schemas.extraction import ExtractionResult, SkillTaxonomyItem
from app.extractors.pipeline import run_extraction_pipeline

app = FastAPI(
    title="Scanza Resume Worker",
    description="Offline fallback resume extraction engine (used when no LLM API key is configured).",
    version="0.1.0",
)

# This service is only ever called server-to-server by main-service, never
# directly by browsers — CORS is wide open here on purpose, real access
# control (API keys, origins) happens at the Next.js / main-service layer.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"success": True, "service": "resume-worker", "status": "healthy"}


@app.post("/extract", response_model=ExtractionResult)
async def extract_resume(
    file: UploadFile = File(...),
    skills_taxonomy: str = Form(default="[]"),
):
    """
    Main extraction endpoint.

    - `file`: the resume PDF/DOCX/TXT
    - `skills_taxonomy`: JSON-encoded array of SkillTaxonomyItem, sent by
      main-service (sourced from Postgres) so this service stays stateless.
    """
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    file_bytes = await file.read()

    if len(file_bytes) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File exceeds {settings.MAX_UPLOAD_MB}MB limit.")

    try:
        taxonomy_raw = json.loads(skills_taxonomy)
        taxonomy: List[SkillTaxonomyItem] = [SkillTaxonomyItem(**item) for item in taxonomy_raw]
    except (json.JSONDecodeError, ValidationError) as e:
        raise HTTPException(status_code=422, detail=f"Invalid skills_taxonomy payload: {e}")

    result = run_extraction_pipeline(
        file_bytes=file_bytes,
        content_type=file.content_type or "",
        filename=file.filename or "resume",
        skills_taxonomy=taxonomy,
    )
    return result


if __name__ == "__main__":
    # Lets `python main.py` work directly, in addition to the documented
    # `uvicorn main:app --reload --port 8000`. This entrypoint intentionally
    # does NOT enable reload=True — uvicorn's reload mode spawns a watcher
    # subprocess that can silently swallow stdout/stderr in some terminal/
    # shell setups (observed: server "starts" but prints nothing and never
    # responds). For hot-reload during active development, run
    # `uvicorn main:app --reload --port 8000` directly instead — that command
    # doesn't go through this subprocess-spawning path.
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)