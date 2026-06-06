from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import ORJSONResponse

from app.database.session import _get_engine
from app.routers.products import router as products_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    engine = _get_engine()
    async with engine.connect() as conn:
        await conn.close()
    yield
    await engine.dispose()

def create_app() -> FastAPI:
    app = FastAPI(
        title="Product Service",
        default_response_class=ORJSONResponse,
        lifespan=lifespan,
    )

    app.include_router(products_router, prefix="/api/v1/products", tags=["products"])

    @app.get("/health", tags=["system"])
    async def health() -> dict:
        return {"status": "ok"}

    return app

app = create_app()