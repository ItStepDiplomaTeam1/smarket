from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from config import settings

# Для NeonDB (хостинг на neon.tech) примусово включаємо SSL,
# але робимо це у правильному для asyncpg форматі connect_args
connect_args = {}
if "neon.tech" in settings.DATABASE_URL:
    connect_args = {"ssl": True}

engine = create_async_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    pool_size=2,
    max_overflow=2
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
