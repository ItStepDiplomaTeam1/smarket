from functools import lru_cache
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from services.api.plugins.security.secrets.load_secret import get_secret
import os

is_debug = os.getenv("DEBUG", "False") == "True"


@lru_cache
def _get_engine():
    database_url = get_secret("DATABASE_URL")
    return create_async_engine(database_url, echo=is_debug)


@lru_cache
def _get_async_session_local():
    return async_sessionmaker(
        _get_engine(), class_=AsyncSession, expire_on_commit=False
    )


async def get_db():
    session_maker = _get_async_session_local()
    async with session_maker() as session:
        yield session
