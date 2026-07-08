from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from src.config import settings

_db_url = settings.DATABASE_URL.replace("postgresql+psycopg2://", "postgresql+asyncpg://").replace("postgresql://", "postgresql+asyncpg://")
engine = create_async_engine(_db_url, echo=False)
AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
