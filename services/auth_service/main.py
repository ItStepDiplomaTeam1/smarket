import datetime
import os
import uuid
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from faststream.rabbit import RabbitBroker
from granian import Granian
from granian.constants import Interfaces
from loguru import logger
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from services.auth_service.database.session import _get_engine
from services.auth_service.plugins.logger import setup_logger
from services.auth_service.plugins.security.auth_cache import (
    close_auth_cache,
    initialize_auth_cache,
)
from services.auth_service.plugins.security.limiters.auth_limiter import auth_limiter
from services.auth_service.plugins.security.secrets.load_secret import get_secret
from services.auth_service.routers.admin import router as admin_router
from services.auth_service.routers.auth import router as auth_router
from services.auth_service.routers.internal import router as internal_router
from services.auth_service.routers.oauth import router as oauth_router

setup_logger()

rmq_url = os.getenv("RABBITMQ_URL") or "amqp://localhost:5672/"
broker = RabbitBroker(rmq_url)

def _coerce_int(value: Any, default: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


@asynccontextmanager
async def lifespan(app: FastAPI):
    engine = _get_engine()
    async with engine.connect() as conn:
        await conn.close()
    logger.info("DB connection pool pre-warmed")
    await initialize_auth_cache()

    try:
        await broker.connect()
        await broker.publish(
            {
                "event_id": str(uuid.uuid4()),
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
                "actor": "system",
                "event_type": "service.lifecycle",
                "entity_type": "service",
                "entity_id": "auth_service",
                "message": "Auth Service started",
                "details": {},
                "severity": "info"
            },
            exchange="smarket_events",
            routing_key="service.lifecycle"
        )
    except Exception as e:
        logger.error(f"Failed to connect to RabbitMQ: {e}")

    yield

    try:
        await broker.publish(
            {
                "event_id": str(uuid.uuid4()),
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
                "actor": "system",
                "event_type": "service.lifecycle",
                "entity_type": "service",
                "entity_id": "auth_service",
                "message": "Auth Service shutting down",
                "details": {},
                "severity": "warning"
            },
            exchange="smarket_events",
            routing_key="service.lifecycle"
        )
        await broker.close()
    except Exception as e:
        logger.error(f"Failed to close RabbitMQ connection: {e}")

    await engine.dispose()
    await close_auth_cache()
    logger.info("DB connection pool closed")


def create_app() -> FastAPI:
    debug = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")
    app = FastAPI(
        title="Auth Service",
        version="1.0.0",
        docs_url="/docs" if debug else None,
        redoc_url="/redoc" if debug else None,
        default_response_class=ORJSONResponse,
        lifespan=lifespan,
    )

    app.state.limiter = auth_limiter._get()
    rate_limit_handler: Any = _rate_limit_exceeded_handler
    app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
    app.add_middleware(SlowAPIMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[],
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-User-Id"],
    )

    app.include_router(auth_router, prefix="/auth", tags=["auth"])
    app.include_router(oauth_router, prefix="/auth", tags=["oauth"])
    app.include_router(admin_router, prefix="/admin", tags=["admin"])
    app.include_router(internal_router, prefix="/internal", tags=["internal"])

    @app.get("/health", tags=["system"])
    async def health() -> dict:
        return {"status": "ok"}

    return app


app = create_app()


if __name__ == "__main__":
    Granian(
        "services.auth_service.main:app",
        address=get_secret("APP_HOST"),
        port=_coerce_int(get_secret("APP_PORT"), 8001),
        interface=Interfaces.ASGI,
        workers=_coerce_int(get_secret("APP_WORKERS"), 2),
        reload=False,
    ).serve()

# Force rebuild of auth_service to deploy new admin routes

