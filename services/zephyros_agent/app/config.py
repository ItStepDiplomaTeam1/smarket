from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "/run/secrets/.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    OPENROUTER_API_KEY: str | None = None
    GROQ_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None
    CEREBRAS_API_KEY: str | None = None

    OPENROUTER_MODEL: str = "meta-llama/llama-3.3-70b-instruct:free"
    GEMINI_MODEL: str = "gemini-3.5-flash"
    GROQ_MODEL: str = "openai/gpt-oss-20b"
    CEREBRAS_MODEL: str = "gpt-oss-120b"

    CIRCUIT_BREAKER_COOLDOWN_SECONDS: int = 60
    LOG_LEVEL: str = "INFO"
    LOG_JSON: bool = False

    SEARCH_SERVICE_URL: str = "http://search_service:8083/api/v1"
    PRODUCT_SERVICE_URL: str = "http://product_service:8000/api/v1"
    CART_SERVICE_URL: str = "http://cart_service:8002/cart"
    REVIEWS_SERVICE_URL: str = "http://reviews_service:8004/reviews"
    REDIS_URL: str = "redis://redis:6379"

    PORT: int = 8005


settings = Settings()
