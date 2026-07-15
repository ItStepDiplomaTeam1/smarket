from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    rabbitmq_url: str = "amqp://smarket:secure_rmq_pass_123@rabbitmq:5672/"
    resend_api_key: str
    frontend_url: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Створюємо об'єкт налаштувань, який імпортуватимемо в інші файли
settings = Settings()
