from contextlib import asynccontextmanager

from fastapi import FastAPI
from granian import Granian
from granian.constants import Interfaces

from services.api.plugins.security.secrets.load_secret import get_secret

from services.auth.main import router as auth_router

from services.api.plugins.logger import setup_logger
from loguru import logger

setup_logger()

def _coerce_int(value: object, default: int) -> int:
    # тут нормализация к сейф инту
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


    app.include_router(auth_router, prefix="/auth")


    @app.get("/health", tags=["system"])
    async def health() -> dict:
        logger.info("Обробка хелсчеку")
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