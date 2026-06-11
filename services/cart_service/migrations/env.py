import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context

# 1. Импортируем наши настройки и Base
from app.config import settings
from app.database.models import Base, Cart, CartItem

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 2. Указываем Alembic, где лежат наши модели
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    # Берем URL из нашего файла настроек
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations() -> None:
    """В этом месте Alembic подключается к БД асинхронно."""
    configuration = config.get_section(config.config_ini_section, {})
    # Подменяем URL на наш из .env файла
    configuration["sqlalchemy.url"] = settings.DATABASE_URL

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())