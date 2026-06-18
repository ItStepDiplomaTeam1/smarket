# Конфігурація product_service
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # SQLAlchemy async DSN (postgresql+asyncpg://...)
    DATABASE_URL: str

    # asyncpg DSN для LISTEN/NOTIFY (postgresql://... — БЕЗ +asyncpg).
    # Якщо не задано явно — дериватується з DATABASE_URL автоматично.
    NOTIFY_DATABASE_URL: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    def get_notify_dsn(self) -> str:
        if self.NOTIFY_DATABASE_URL:
            return self.NOTIFY_DATABASE_URL
        return self.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")


settings = Settings()
