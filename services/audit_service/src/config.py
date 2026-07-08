from urllib.parse import urlparse, urlencode, parse_qs, urlunparse
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "/run/secrets/.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    DATABASE_URL: str
    RABBITMQ_URL: str

    @field_validator("DATABASE_URL")
    @classmethod
    def normalize_db_url(cls, v: str) -> str:
        # 1. Normalize scheme to asyncpg
        v = v.replace("postgresql+psycopg2://", "postgresql+asyncpg://")
        v = v.replace("postgresql://", "postgresql+asyncpg://")

        # 2. Fix query params: asyncpg does not support sslmode or channel_binding
        parsed = urlparse(v)
        params = parse_qs(parsed.query, keep_blank_values=True)

        had_ssl = "sslmode" in params
        params.pop("sslmode", None)
        params.pop("channel_binding", None)

        if had_ssl:
            params["ssl"] = ["require"]

        new_query = urlencode({k: v[0] for k, v in params.items()})
        normalized = urlunparse(parsed._replace(query=new_query))
        return normalized

settings = Settings()

