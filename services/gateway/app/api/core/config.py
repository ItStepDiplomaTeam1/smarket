from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"

    # Адреси сервісів всередині мережі Docker Compose
    AUTH_SERVICE_URL: str = "http://auth_service:8001"
    BUSINESS_SERVICE_URL: str = "http://business_logic_service:8000"


settings = Settings()
