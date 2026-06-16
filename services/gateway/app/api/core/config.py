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
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"

    # -------------------------------------------------------
    #  Адреси внутрішніх мікросервісів
    # -------------------------------------------------------
    AUTH_SERVICE_URL: str = "http://auth_service:8001"
    PRODUCT_SERVICE_URL: str = "http://business_logic_service:8000"
    STORES_SERVICE_URL: str = "http://product_service:8000/api/v1/stores"
    CART_SERVICE_URL: str = "http://cart_service:8002"


settings = Settings()
