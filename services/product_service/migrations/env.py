"""
migrations/env.py — конфігурація Alembic для product_service.

ВАЖЛИВО: product_service є READ-ONLY клієнтом спільної бази даних.
Таблиці products, prices, stores, categories СТВОРЮЄ та УПРАВЛЯЄ ними
ETL-воркер (products_etl, Go) через database/migrate.go.

Alembic у цьому сервісі НЕ повинен торкатися ETL-таблиць.
target_metadata = None — щоб alembic autogenerate не пропонував DROP TABLE.

Як правило, alembic тут запускати не потрібно взагалі.
Якщо в майбутньому product_service матиме власні таблиці (наприклад, favorites, cart),
їх потрібно оголошувати в окремому Base, НЕ змішуючи з ETL-моделями.
"""

import asyncio
import logging
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

from app.config import settings

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# target_metadata = None: Alembic не знає про жодну з таблиць →
# autogenerate не буде пропонувати DROP TABLE для ETL-таблиць.
target_metadata = None

config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

logger = logging.getLogger("alembic.env")
logger.warning(
    "[alembic] product_service використовує спільну БД з products_etl. "
    "Таблиці керуються Go-воркером. Запускайте міграції тільки якщо ви "
    "свідомо додаєте власні таблиці до цього сервісу."
)


def run_migrations_offline() -> None:
    """Офлайн режим (без підключення до БД)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        version_table="alembic_version_product",
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Функція для виконання самих міграцій."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        version_table="alembic_version_product",
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Онлайн режим: створюємо асинхронне підключення та запускаємо міграції."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Точка входу для онлайн режиму."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
