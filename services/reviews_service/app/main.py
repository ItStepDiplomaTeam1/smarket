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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reviews_router, prefix="/api/v1")


@app.get("/health", tags=["System"])
async def health_check():
    """Ендпоінт для перевірки статусу мікросервісу"""
    return {"status": "ok", "service": "reviews_service"}
