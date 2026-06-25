from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.reviews import router as reviews_router

app = FastAPI(
    title="Reviews Service",
    description="Мікросервіс для роботи з відгуками товарів",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-User-Id"],
)

app.include_router(reviews_router, prefix="/api/v1")


@app.get("/health", tags=["System"])
async def health_check():
    """Ендпоінт для перевірки статусу мікросервісу"""
    return {"status": "ok", "service": "reviews_service"}
