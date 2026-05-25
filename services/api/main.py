from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import ORJSONResponse
from granian import Granian
from granian.constants import Interfaces
from loguru import logger

from services.api.plugins.logger import setup_logger
from services.api.plugins.security.secrets.load_secret import get_secret

setup_logger()


def _coerce_int(value: object, default: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="Product Booking",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        default_response_class=ORJSONResponse,
        lifespan=lifespan,
    )

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