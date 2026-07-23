from typing import Literal
from urllib.parse import urlsplit

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Налаштування поведінки Pydantic
    model_config = SettingsConfigDict(
        # В Docker .env не копіюється — змінні приходять через docker-compose env_file.
        # Pydantic спочатку спробує завантажити файл, а якщо не знайде — візьме з env.
        env_file=(".env", "/run/secrets/.env"),
        env_file_encoding="utf-8",
        # Дозволяємо Pydantic приймати змінні з .env незалежно від регістру літер
        case_sensitive=False,
        # Ігноруємо зайві системні змінні Windows/Docker
        extra="ignore",
    )

    # -------------------------------------------------------
    #  JWT (спільний секрет між Gateway та Auth Service)
    # -------------------------------------------------------
    JWT_SECRET_KEY: str = Field(min_length=32)
    JWT_ALGORITHM: Literal["HS256"] = "HS256"
    ENV: str = "development"
    CORS_ORIGINS: str = ""

    # -------------------------------------------------------
    #  Адреси внутрішніх мікросервісів
    # -------------------------------------------------------
    AUTH_SERVICE_URL: str = "http://auth_service:8001"
    PRODUCT_SERVICE_URL: str = "http://product_service:8000"
    STORES_SERVICE_URL: str = "http://product_service:8000/api/v1/stores"
    CART_SERVICE_URL: str = "http://cart_service:8002"
    REVIEWS_SERVICE_URL: str = "http://reviews_service:8004"
    ETL_SERVICE_URL: str = "http://products_etl:8082"
    ETL_ADMIN_KEY: str = Field(min_length=32)
    SEARCH_SERVICE_URL: str = "http://search_service:8083"
    AGENT_SERVICE_URL: str = "http://zephyros_agent:8005"
    EMAIL_WORKER_URL: str = "http://email_worker:8085"
    AUDIT_SERVICE_URL: str = "http://audit_service:8006"

    @property
    def allowed_cors_origins(self) -> list[str]:
        origins = {
            "https://smarket-7go.pages.dev",
            "https://smarket-admin.pages.dev",
        }
        for configured_origin in self.CORS_ORIGINS.split(","):
            origin = configured_origin.strip().rstrip("/")
            if not origin:
                continue
            parsed = urlsplit(origin)
            if (
                origin == "*"
                or parsed.scheme not in {"http", "https"}
                or not parsed.netloc
                or parsed.path
                or parsed.query
                or parsed.fragment
            ):
                raise ValueError(f"Invalid CORS origin: {origin!r}")
            if self.ENV.lower() == "production" and parsed.scheme != "https":
                raise ValueError("Production CORS origins must use HTTPS")
            origins.add(origin)
        if self.ENV.lower() != "production":
            origins.update(
                {
                    "http://localhost:3000",
                    "http://localhost:5173",
                    "http://localhost:5174",
                    "http://127.0.0.1:3000",
                    "http://127.0.0.1:5173",
                    "http://127.0.0.1:5174",
                }
            )
        return sorted(origins)

    @model_validator(mode="after")
    def clean_product_service_url(self) -> "Settings":
        if self.PRODUCT_SERVICE_URL:
            url = self.PRODUCT_SERVICE_URL.rstrip("/")
            if url.endswith("/api/v1/products"):
                url = url.removesuffix("/api/v1/products")
            self.PRODUCT_SERVICE_URL = url
        return self


# Required values are populated from the process environment by BaseSettings.
settings = Settings()  # type: ignore[call-arg]
