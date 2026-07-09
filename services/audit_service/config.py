from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    RABBITMQ_URL: str

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def fix_database_url(cls, v: str) -> str:
        """
        1. Видаляє query-параметри на кшталт ?sslmode=require, які не підтримує asyncpg.
        2. Автоматично замінює postgresql:// на postgresql+asyncpg://
        """
        if isinstance(v, str):
            # Видаляємо query-параметри (наприклад, ?sslmode=require...)
            if "?" in v:
                v = v.split("?")[0]
                
            if v.startswith("postgresql://"):
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
            elif v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+asyncpg://", 1)
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
