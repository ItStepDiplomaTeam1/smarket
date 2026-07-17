import asyncio
import logging
from contextlib import asynccontextmanager
import uuid
import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from faststream.rabbit import RabbitBroker, RabbitExchange, ExchangeType

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

broker = RabbitBroker(settings.RABBITMQ_URL)
smarket_events_exchange = RabbitExchange("smarket_events", type=ExchangeType.TOPIC)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    engine = _get_engine()
    async with engine.connect() as conn:
        await conn.close()
    logger.info("[main] ✅ З'єднання з PostgreSQL підтверджено.")

    try:
        await broker.connect()
        await broker.publish(
            {
                "event_id": str(uuid.uuid4()),
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
                "actor": "system",
                "event_type": "service.lifecycle",
                "entity_type": "service",
                "entity_id": "product_service",
                "message": "Product Service started",
                "details": {},
                "severity": "info"
            },
            exchange=smarket_events_exchange,
            routing_key="service.lifecycle"
        )
    except Exception as e:
        logger.error(f"Failed to connect to RabbitMQ: {e}")

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

    try:
        await broker.publish(
            {
                "event_id": str(uuid.uuid4()),
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
                "actor": "system",
                "event_type": "service.lifecycle",
                "entity_type": "service",
                "entity_id": "product_service",
                "message": "Product Service shutting down",
                "details": {},
                "severity": "warning"
            },
            exchange=smarket_events_exchange,
            routing_key="service.lifecycle"
        )
        await broker.close()
    except Exception as e:
        logger.error(f"Failed to close RabbitMQ connection: {e}")

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

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[],
        allow_credentials=False,
        allow_methods=["GET", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-User-Id"],
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
