from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str

    PRODUCT_SERVICE_URL: str = "http://127.0.0.1:8001"
    RABBITMQ_URL: str = "amqp://smarket:smarket@rabbitmq:5672/"

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


settings = Settings()
