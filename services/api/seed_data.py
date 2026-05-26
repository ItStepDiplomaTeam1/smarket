import asyncio
import os

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from services.api.database.services.models import Category, Retailer

_DATABASE_URL = os.environ["DATABASE_URL"]

_engine = create_async_engine(
    _DATABASE_URL,
    pool_size=2,
    max_overflow=0,
    pool_pre_ping=True,
)

_SessionLocal = async_sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)


async def _seed_categories(session: AsyncSession) -> None:
    result = await session.execute(select(Category).limit(1))
    if result.scalars().first() is not None:
        logger.info("Categories already seeded, skipping")
        return

    session.add(Category(name="Електроніка", slug="elektronika"))
    session.add(Category(name="Побутова техніка", slug="pobutova-tekhnika"))
    session.add(Category(name="Смартфони", slug="smartfony"))
    await session.flush()
    logger.info("Seeded default categories")


async def _seed_retailers(session: AsyncSession) -> None:
    result = await session.execute(select(Retailer).limit(1))
    if result.scalars().first() is not None:
        logger.info("Retailers already seeded, skipping")
        return

    session.add(Retailer(name="Smarket-Retail", logo_url="https://example.com/logo.png"))
    await session.flush()
    logger.info("Seeded default retailers")


async def run_seed() -> None:
    logger.info("Starting database seed")
    async with _SessionLocal() as session, session.begin():
        await _seed_categories(session)
        await _seed_retailers(session)
    await _engine.dispose()
    logger.info("Database seed completed successfully")


if __name__ == "__main__":
    asyncio.run(run_seed())
