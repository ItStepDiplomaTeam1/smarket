from pydantic import model_validator
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

    OPENROUTER_MODEL: str = "openrouter/free"
    GEMINI_MODEL: str = "gemini-3.5-flash"
    GROQ_MODEL: str = "openai/gpt-oss-20b"
    CEREBRAS_MODEL: str = "gpt-oss-120b"

    CIRCUIT_BREAKER_COOLDOWN_SECONDS: int = 60
    PROVIDER_TIMEOUT_SECONDS: float = 18.0
    PROVIDER_CONCURRENCY_LIMIT: int = 8
    CHAT_REQUEST_BUDGET_SECONDS: float = 22.0
    CHAT_CACHE_TTL_SECONDS: int = 45
    CHAT_SINGLEFLIGHT_TTL_SECONDS: int = 30
    CHAT_HISTORY_MAX_MESSAGES: int = 8
    CHAT_HISTORY_MAX_CHARS: int = 6000
    CHAT_MAX_BLOCKS: int = 16
    CHAT_MAX_TEXT_CHARS: int = 6000
    CHAT_CONTEXT_MAX_PRODUCTS: int = 8
    CHAT_MAX_INPUT_CHARS: int = 2000
    CHAT_MAX_CONTEXT_CHARS: int = 12000
    CHAT_MAX_OUTPUT_TOKENS: int = 1200
    INTERNAL_READ_TIMEOUT_SECONDS: float = 5.0
    CART_COMPARISON_TIMEOUT_SECONDS: float = 12.0
    ZEPHYROS_ROUTING_MODE: str = "parallel-race"
    ZEPHYROS_PARALLEL_COHORT_PERCENT: int = 100
    ZEPHYROS_ACTION_EXECUTOR_ENABLED: bool = True
    ZEPHYROS_OPERATOR_KEY: str | None = None
    INTENT_CLASSIFIER_ENABLED: bool = True
    INTENT_CLASSIFIER_TIMEOUT_SECONDS: float = 1.0
    INTENT_CLASSIFIER_CACHE_TTL_SECONDS: int = 86400
    INTENT_CLASSIFIER_PROMPT: str = (
        "Ти — класифікатор інтенту користувача для помічника покупок Smarket.\n"
        "Твоє завдання — визначити, чи хоче користувач знайти/купити конкретний товар, "
        "чи він ставить загальне питання про використання сервісу, вітається, або просто спілкується (chitchat).\n"
        "Поверни виключно одне з двох слів:\n"
        "- `catalog_search` (якщо користувач шукає конкретні товари, ціни, знижки, наявність)\n"
        "- `none` (якщо це chitchat, вітання, загальне питання типу 'як працює кошик', 'які магазини є', 'що ти вмієш')\n"
        "Не пиши жодних інших слів, пояснень чи знаків пунктуації."
    )
    CHAT_SUCCESS_RATE_SLO: float = 0.995
    CHAT_LATENCY_P95_SLO_MS: int = 12000
    LOG_LEVEL: str = "INFO"
    LOG_JSON: bool = False

    SEARCH_SERVICE_URL: str = "http://search_service:8083/api/v1"
    PRODUCT_SERVICE_URL: str = "http://product_service:8000/api/v1"
    CART_SERVICE_URL: str = "http://cart_service:8002/cart"
    REVIEWS_SERVICE_URL: str = "http://reviews_service:8004/reviews"
    REDIS_URL: str = "redis://redis:6379"

    PORT: int = 8005

    @model_validator(mode="after")
    def validate_orchestration_settings(self) -> "Settings":
        if self.ZEPHYROS_ROUTING_MODE not in {"parallel-race", "sequential"}:
            raise ValueError("ZEPHYROS_ROUTING_MODE must be parallel-race or sequential")
        positive_values = {
            "CIRCUIT_BREAKER_COOLDOWN_SECONDS": self.CIRCUIT_BREAKER_COOLDOWN_SECONDS,
            "PROVIDER_TIMEOUT_SECONDS": self.PROVIDER_TIMEOUT_SECONDS,
            "PROVIDER_CONCURRENCY_LIMIT": self.PROVIDER_CONCURRENCY_LIMIT,
            "CHAT_REQUEST_BUDGET_SECONDS": self.CHAT_REQUEST_BUDGET_SECONDS,
            "CHAT_CACHE_TTL_SECONDS": self.CHAT_CACHE_TTL_SECONDS,
            "CHAT_SINGLEFLIGHT_TTL_SECONDS": self.CHAT_SINGLEFLIGHT_TTL_SECONDS,
            "CHAT_HISTORY_MAX_MESSAGES": self.CHAT_HISTORY_MAX_MESSAGES,
            "CHAT_HISTORY_MAX_CHARS": self.CHAT_HISTORY_MAX_CHARS,
            "CHAT_MAX_BLOCKS": self.CHAT_MAX_BLOCKS,
            "CHAT_MAX_TEXT_CHARS": self.CHAT_MAX_TEXT_CHARS,
            "CHAT_CONTEXT_MAX_PRODUCTS": self.CHAT_CONTEXT_MAX_PRODUCTS,
            "CHAT_MAX_INPUT_CHARS": self.CHAT_MAX_INPUT_CHARS,
            "CHAT_MAX_CONTEXT_CHARS": self.CHAT_MAX_CONTEXT_CHARS,
            "CHAT_MAX_OUTPUT_TOKENS": self.CHAT_MAX_OUTPUT_TOKENS,
            "INTERNAL_READ_TIMEOUT_SECONDS": self.INTERNAL_READ_TIMEOUT_SECONDS,
            "CART_COMPARISON_TIMEOUT_SECONDS": self.CART_COMPARISON_TIMEOUT_SECONDS,
            "CHAT_LATENCY_P95_SLO_MS": self.CHAT_LATENCY_P95_SLO_MS,
            "INTENT_CLASSIFIER_TIMEOUT_SECONDS": self.INTENT_CLASSIFIER_TIMEOUT_SECONDS,
            "INTENT_CLASSIFIER_CACHE_TTL_SECONDS": self.INTENT_CLASSIFIER_CACHE_TTL_SECONDS,
        }
        invalid = [name for name, value in positive_values.items() if value <= 0]
        if invalid:
            raise ValueError(f"Zephyros limits must be positive: {', '.join(invalid)}")
        if not 0 < self.CHAT_SUCCESS_RATE_SLO <= 1:
            raise ValueError("CHAT_SUCCESS_RATE_SLO must be between 0 and 1")
        if not 0 <= self.ZEPHYROS_PARALLEL_COHORT_PERCENT <= 100:
            raise ValueError("ZEPHYROS_PARALLEL_COHORT_PERCENT must be between 0 and 100")
        return self


settings = Settings()
