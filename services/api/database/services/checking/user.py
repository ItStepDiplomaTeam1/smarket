from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from services.api.database.services.create_tables import User
from services.api.plugins.security.hash.password import verify_password


async def user_password_check(session: AsyncSession, email: str, outer_password: str) -> bool:
    result = await session.execute(
        select(User).where(User.email == email)
    )
    user = result.scalar_one_or_none()

    if user is None:
        return False
