# Конфігурація product_service
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # SQLAlchemy async DSN (postgresql+asyncpg://...)
    DATABASE_URL: str
    RABBITMQ_URL: str = "amqp://guest:guest@localhost:5672/"

    # asyncpg DSN для LISTEN/NOTIFY (postgresql://... — БЕЗ +asyncpg).
    # Якщо не задано явно — дериватується з DATABASE_URL автоматично.
    NOTIFY_DATABASE_URL: str = ""

    SEARCH_SERVICE_URL: str = "http://search_service:8083"
    SEARCH_INTERNAL_API_TOKEN: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    def get_notify_dsn(self) -> str:
        if self.NOTIFY_DATABASE_URL:
            return self.NOTIFY_DATABASE_URL
        return self.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")


settings = Settings()
