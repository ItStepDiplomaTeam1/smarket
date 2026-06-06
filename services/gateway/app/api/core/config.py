from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Налаштування поведінки Pydantic
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        # 1. Дозволяємо Pydantic приймати змінні з .env незалежно від регістру літер
        case_sensitive=False,
        # 2. Кажемо "ignore" замість "forbid", якщо в .env є інші системні змінні Windows/Docker
        extra="ignore" 
    )



settings = Settings()
