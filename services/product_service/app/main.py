import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import ORJSONResponse

from app.config import settings
from app.database.session import _get_engine
from app.listeners.pg_listener import run_pg_listener
from app.routers.internal import router as internal_router
from app.routers.products import router as products_router
from app.routers.stores import router as stores_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    engine = _get_engine()
    # Перевіряємо підключення до БД при старті
    async with engine.connect() as conn:
        await conn.close()
    logger.info("[main] ✅ З'єднання з PostgreSQL підтверджено.")

    # Стратегія 3: запускаємо слухач pg_notify у фоновій задачі.
    # asyncio.create_task гарантує що listener живе весь час роботи сервера,
    # а не лише поки обробляється якийсь запит.
    notify_dsn = settings.get_notify_dsn()
    logger.info("[main] Запуск PG LISTEN/NOTIFY listener (dsn=...%s)", notify_dsn[-30:])
    listener_task = asyncio.create_task(
        run_pg_listener(notify_dsn),
        name="pg-products-listener",
    )

    yield

    # --- Shutdown ---
    logger.info("[main] Зупинка PG listener...")
    listener_task.cancel()
    try:
        await listener_task
    except asyncio.CancelledError:
        pass  # очікувана поведінка при cancel()

    await engine.dispose()
    logger.info("[main] Сервіс зупинено.")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Product Service",
        description=(
            "Read-only API для каталогу товарів та магазинів Zakaz.ua. "
            "Дані наповнюються ETL-воркером (products_etl). "
            "Отримує сповіщення про оновлення через PostgreSQL LISTEN/NOTIFY."
        ),
        version="1.0.0",
        default_response_class=ORJSONResponse,
        lifespan=lifespan,
    )

    # Каталог товарів (read-only, джерело — products_etl)
    app.include_router(products_router, prefix="/api/v1/products", tags=["products"])
    # Магазини (read-only, джерело — products_etl)
    app.include_router(stores_router, prefix="/api/v1/stores", tags=["stores"])
    # Внутрішній ендпоінт моніторингу (лише для Gateway, не виставляти назовні)
    app.include_router(internal_router, prefix="/api/v1/internal", tags=["internal"])

    @app.get("/health", tags=["system"])
    async def health() -> dict:
        return {"status": "ok"}

    return app


app = create_app()
