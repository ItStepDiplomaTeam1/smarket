from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uuid
import datetime

from faststream.rabbit import RabbitBroker, RabbitExchange, ExchangeType

from app.config import settings
from app.routers.reviews import router as reviews_router
from app.routers import internal

broker = RabbitBroker(settings.RABBITMQ_URL)
smarket_events_exchange = RabbitExchange("smarket_events", type=ExchangeType.TOPIC)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await broker.connect()
        await broker.publish(
            {
                "event_id": str(uuid.uuid4()),
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
                "actor": "system",
                "event_type": "service.lifecycle",
                "entity_type": "service",
                "entity_id": "reviews_service",
                "message": "Reviews Service started",
                "details": {},
                "severity": "info"
            },
            exchange=smarket_events_exchange,
            routing_key="service.lifecycle"
        )
    except Exception:
        pass
    yield
    try:
        await broker.publish(
            {
                "event_id": str(uuid.uuid4()),
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
                "actor": "system",
                "event_type": "service.lifecycle",
                "entity_type": "service",
                "entity_id": "reviews_service",
                "message": "Reviews Service shutting down",
                "details": {},
                "severity": "warning"
            },
            exchange=smarket_events_exchange,
            routing_key="service.lifecycle"
        )
        await broker.close()
    except Exception:
        pass

app = FastAPI(
    title="Reviews Service",
    description="Мікросервіс для роботи з відгуками товарів",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-User-Id"],
)

app.include_router(reviews_router, prefix="/api/v1")
app.include_router(internal.router, prefix="/internal", tags=["Internal"])


@app.get("/health", tags=["System"])
async def health_check():
    """Ендпоінт для перевірки статусу мікросервісу"""
    return {"status": "ok", "service": "reviews_service"}
