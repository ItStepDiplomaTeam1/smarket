from unittest.mock import AsyncMock, MagicMock

import pytest

from services.auth_service.plugins.checking import user as user_checker
from services.auth_service.plugins.security.auth_cache import CachedAuthUser


@pytest.mark.asyncio
async def test_authenticated_user_uses_cached_credentials(monkeypatch: pytest.MonkeyPatch) -> None:
    cached_user = CachedAuthUser(
        id="e2e0ac63-8f29-471c-9065-660bc277d790",
        email="user@example.com",
        hashed_password="$2b$12$9FBhdcjO1qrGPXU7bQCwYuaJ0htmFHkF33SS23PRxGagXHey2iBfS",
        role="user",
        is_active=True,
    )
    session = AsyncMock()
    monkeypatch.setattr(user_checker, "get_cached_auth_user", AsyncMock(return_value=cached_user))

    user = await user_checker.get_authenticated_user(session, "user@example.com", "Secret123!")

    assert user == cached_user
    session.execute.assert_not_awaited()


@pytest.mark.asyncio
async def test_authenticated_user_populates_cache_after_database_miss(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    db_user = AsyncMock()
    db_user.is_active = True
    db_user.hashed_password = "$2b$12$9FBhdcjO1qrGPXU7bQCwYuaJ0htmFHkF33SS23PRxGagXHey2iBfS"
    result = MagicMock()
    result.scalar_one_or_none.return_value = db_user
    session = AsyncMock()
    session.execute.return_value = result
    cache_auth_user = AsyncMock()
    monkeypatch.setattr(user_checker, "get_cached_auth_user", AsyncMock(return_value=None))
    monkeypatch.setattr(user_checker, "cache_auth_user", cache_auth_user)

    user = await user_checker.get_authenticated_user(session, "user@example.com", "Secret123!")

    assert user == db_user
    cache_auth_user.assert_awaited_once_with(db_user)
