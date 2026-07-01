from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "/run/secrets/.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    OPENROUTER_API_KEY: str

    SEARCH_SERVICE_URL: str = "http://search_service:8083/api/v1"
    PRODUCT_SERVICE_URL: str = "http://product_service:8000/api/v1"
    CART_SERVICE_URL: str = "http://cart_service:8002/cart"

    PORT: int = 8005


settings = Settings()
