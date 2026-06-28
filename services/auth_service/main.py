import os
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from granian import Granian
from granian.constants import Interfaces
from loguru import logger
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from services.auth_service.database.session import _get_engine
from services.auth_service.plugins.logger import setup_logger
from services.auth_service.plugins.security.limiters.auth_limiter import auth_limiter
from services.auth_service.plugins.security.secrets.load_secret import get_secret
from services.auth_service.routers.auth import router as auth_router
from services.auth_service.routers.oauth import router as oauth_router
from services.auth_service.routers.admin import router as admin_router

setup_logger()


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
    yield
    await engine.dispose()
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

