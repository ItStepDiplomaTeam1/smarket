from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from app.routers import cart, internal, favorites
from app.config import settings
from faststream.rabbit import RabbitBroker
from contextlib import asynccontextmanager

import uuid
import datetime

broker = RabbitBroker(settings.RABBITMQ_URL)

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
                "entity_id": "cart_service",
                "message": "Cart Service started",
                "details": {},
                "severity": "info"
            },
            exchange="smarket_events",
            routing_key="service.lifecycle"
        )
    except Exception as e:
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
                "entity_id": "cart_service",
                "message": "Cart Service shutting down",
                "details": {},
                "severity": "warning"
            },
            exchange="smarket_events",
            routing_key="service.lifecycle"
        )
        await broker.close()
    except Exception:
        pass

app = FastAPI(
    title="Cart Service",
    version="1.0.0",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-User-Id"],
)

app.include_router(cart.router)
app.include_router(favorites.router)
app.include_router(internal.router, prefix="/internal", tags=["Internal"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "Cart service"}
