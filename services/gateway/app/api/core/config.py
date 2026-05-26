from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    JWT_SECRET_KEY: str = "my-super-secret-key-for-diploma" # Візьмемо з .env ліда
    JWT_ALGORITHM: str = "HS256"
    
    # Адреси сервісів всередині мережі Docker Compose
    AUTH_SERVICE_URL: str = "http://auth_service:8001"
    BUSINESS_SERVICE_URL: str = "http://business_logic_service:8000"

settings = Settings()