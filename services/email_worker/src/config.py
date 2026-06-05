from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    rabbitmq_url: str = "amqp://smarket:smarket@rabbitmq:5672/"
    resend_api_key: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# Створюємо об'єкт налаштувань, який імпортуватимемо в інші файли
settings = Settings()