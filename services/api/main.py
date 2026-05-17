from contextlib import asynccontextmanager

from fastapi import FastAPI
from granian import Granian
from granian.constants import Interfaces

from services.api.plugins.security.secrets.load_secret import get_secret


def _coerce_int(value: object, default: int) -> int:
    # Секреты почти всегда - string, поэтому тут нормализация к сейф инту
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup: init DB pool, redis, etc.
    yield
    # shutdown: close connections


def create_app() -> FastAPI:
    app = FastAPI(
        title='Product Booking',
        version='0.1.0',
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # Routers
    # from app.api.v1 import router as v1_router
    # app.include_router(v1_router, prefix="/api/v1")

    @app.get("/health", tags=["system"])
    async def health() -> dict:
        return {"status": "ok"}

    return app


app = create_app()


if __name__ == "__main__":
    Granian(
        "services.api.main:app",
        address=get_secret("APP_HOST"),
        port=_coerce_int(get_secret("APP_PORT"), 8000),
        interface=Interfaces.ASGI,
        workers=_coerce_int(get_secret("APP_WORKERS"), 1),
        reload=False,
    ).serve()