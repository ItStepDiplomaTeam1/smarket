from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from services.auth_service.database.models import User
from services.auth_service.plugins.security.hash.password import verify_password


async def get_authenticated_user(session: AsyncSession, email: str, outer_password: str) -> User | None:
    result = await session.execute(
        select(User).where(User.email == email)
    )
    user = result.scalar_one_or_none()

    if user is None:
        return None

    if not verify_password(outer_password, user.hashed_password):
        return None

    return user
