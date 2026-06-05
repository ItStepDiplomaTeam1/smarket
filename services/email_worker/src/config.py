from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Якщо змінної немає в .env, використається це значення за замовчуванням
    rabbitmq_url: str = "amqp://guest:guest@localhost:5672/"
    resend_api_key: str = "" # На майбутнє

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# Створюємо об'єкт налаштувань, який імпортуватимемо в інші файли
settings = Settings()