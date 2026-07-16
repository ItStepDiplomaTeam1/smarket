import os
from functools import lru_cache
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings

_IS_DEBUG = os.getenv("DEBUG", "False") == "True"


@lru_cache
def _get_engine():
    return create_async_engine(
        settings.DATABASE_URL,
        echo=_IS_DEBUG,
        pool_size=2,
        max_overflow=2,
        pool_pre_ping=True,
        pool_timeout=30,
    )


@lru_cache
def _get_session_factory():
    return async_sessionmaker(
        _get_engine(),
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )


async def get_db():
    async with _get_session_factory()() as session:
        yield session
