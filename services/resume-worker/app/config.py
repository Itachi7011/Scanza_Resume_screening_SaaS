from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Loaded from environment variables (see .env.example). This worker is
    deliberately stateless and has NO database connection — it receives
    everything it needs (file bytes + the current skill taxonomy) in the
    request, and returns pure structured JSON. That keeps it trivially
    horizontally-scalable if resume volume grows.
    """

    ENV: str = "development"
    PORT: int = 8000

    MAX_UPLOAD_MB: int = 10
    SPACY_MODEL: str = "en_core_web_sm"

    # Minimum fuzzy-match score (0-100) for skill/city alias matching.
    FUZZY_MATCH_THRESHOLD: int = 87

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()