from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from services.api.plugins.security.secrets.load_secret import get_secret


DATABASE_URL = get_secret('DATABASE_URL')

engine = create_async_engine(DATABASE_URL, echo=get_secret("DEBUG") == "True")

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session