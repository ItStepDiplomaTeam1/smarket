from contextlib import asynccontextmanager

from fastapi import FastAPI
from granian import Granian
from granian.constants import Interfaces

from services.api.plugins.security.secrets.load_secret import get_secret

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
        "app.main:app",
        address=get_secret("APP_HOST"),
        port=get_secret("APP_PORT"),
        interface=Interfaces.ASGI,
        workers=get_secret("APP_WORKERS"),
        reload=False,
    ).serve()