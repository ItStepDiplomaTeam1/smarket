from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from services.auth_service.database.models import User
from services.auth_service.plugins.security.auth_cache import (
    CachedAuthUser,
    cache_auth_user,
    get_cached_auth_user,
)
from services.auth_service.plugins.security.hash.password import verify_password


async def get_authenticated_user(
    session: AsyncSession, email: str, outer_password: str
) -> User | CachedAuthUser | None:
    cached_user = await get_cached_auth_user(email)
    if cached_user is not None:
        if not cached_user.is_active:
            return None
        return cached_user if verify_password(outer_password, cached_user.hashed_password) else None

    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        return None

    # Cache both successful and failed password attempts for an existing user;
    # the bcrypt comparison is still performed for every request.
    await cache_auth_user(user)

    if not verify_password(outer_password, user.hashed_password):
        return None

    return user
