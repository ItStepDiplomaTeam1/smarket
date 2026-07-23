import datetime
import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

import services.auth_service.plugins.security.token_blacklist as token_blacklist
import services.auth_service.routers.auth as auth_router
import services.auth_service.routers.oauth as oauth_router
from services.auth_service.database.models import User
from services.auth_service.database.session import get_db
from services.auth_service.main import app

client = TestClient(app)


# Helper mock redis class
class MockRedis:
    def __init__(self):
        self.store = {}

    async def get(self, key):
        val = self.store.get(key)
        return val.encode("utf-8") if isinstance(val, str) else val

    async def getdel(self, key):
        val = self.store.pop(key, None)
        return val.encode("utf-8") if isinstance(val, str) else val

    async def setex(self, key, ttl, value):
        self.store[key] = value

    async def set(self, key, value, ex=None, nx=False):
        if nx and key in self.store:
            return False
        self.store[key] = value
        return True

    async def exists(self, key):
        return key in self.store

    async def delete(self, key):
        self.store.pop(key, None)


@pytest.fixture
def mock_db():
    db = AsyncMock()
    app.dependency_overrides[get_db] = lambda: db
    yield db
    app.dependency_overrides.clear()


@pytest.fixture
def mock_redis(monkeypatch):
    r = MockRedis()
    monkeypatch.setattr(auth_router, "_get_redis_client", lambda: r)
    monkeypatch.setattr(token_blacklist, "_get_redis_client", lambda: r)
    return r


# --- Google OAuth Login Flow ---


@pytest.mark.asyncio
async def test_google_oauth_new_user(monkeypatch, mock_db):
    # Mock verify google id token
    async def mock_verify(credential):
        return {"email": "new_google@example.com", "name": "Google User", "picture": "http://img"}

    monkeypatch.setattr(oauth_router, "_verify_google_id_token", mock_verify)
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "dummy-client-id")

    # Mock user query to return None (new user)
    mock_execute_result = MagicMock()
    mock_execute_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_execute_result

    response = client.post("/auth/oauth/google", json={"credential": "valid-credential"})

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "new_google@example.com"

    # Assert new user DB insertion
    mock_db.add.assert_called_once()
    mock_db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_google_oauth_existing_user(monkeypatch, mock_db):
    # Mock verify google id token
    async def mock_verify(credential):
        return {"email": "existing_google@example.com", "name": "Google User"}

    monkeypatch.setattr(oauth_router, "_verify_google_id_token", mock_verify)
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "dummy-client-id")

    # Mock user query to return existing active user
    existing_user = User(
        id=uuid.uuid4(),
        email="existing_google@example.com",
        hashed_password="OAUTH_NO_PASSWORD",
        role="user",
        is_active=True,
        settings={},
    )
    mock_execute_result = MagicMock()
    mock_execute_result.scalar_one_or_none.return_value = existing_user
    mock_db.execute.return_value = mock_execute_result

    response = client.post("/auth/oauth/google", json={"credential": "valid-credential"})

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "existing_google@example.com"

    # Assert NO new user DB insertion
    mock_db.add.assert_not_called()
    mock_db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_google_oauth_invalid_token(monkeypatch, mock_db):
    # Mock verify google id token to raise ValueError
    async def mock_verify(credential):
        raise ValueError("Invalid Google token")

    monkeypatch.setattr(oauth_router, "_verify_google_id_token", mock_verify)

    response = client.post("/auth/oauth/google", json={"credential": "invalid-credential"})

    assert response.status_code == 401
    assert "Invalid Google credential" in response.json()["detail"]


# --- Telegram OAuth Login Flow ---


@pytest.mark.asyncio
async def test_telegram_oauth_success(monkeypatch, mock_db):
    # Mock verify_telegram_auth validation helper
    monkeypatch.setattr(oauth_router, "verify_telegram_auth", lambda payload: True)

    # Mock user query to return None (new tg user)
    mock_execute_result = MagicMock()
    mock_execute_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_execute_result

    tg_payload = {
        "id": 12345678,
        "first_name": "TgUser",
        "username": "tg_user_handle",
        "auth_date": 1600000000,
        "hash": "valid-hash",
    }

    response = client.post("/auth/oauth/telegram", json=tg_payload)

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "tg_12345678@smarket.local"

    # Assert DB insert of new user
    mock_db.add.assert_called_once()
    mock_db.commit.assert_awaited_once()


# --- Password Recovery Flow ---


@pytest.mark.asyncio
async def test_forgot_password_success(monkeypatch, mock_db, mock_redis):
    # Mock user query to return active user
    user = User(id=uuid.uuid4(), email="user@example.com", is_active=True)
    mock_execute_result = MagicMock()
    mock_execute_result.scalar_one_or_none.return_value = user
    mock_db.execute.return_value = mock_execute_result

    # Mock sending password recovery email
    mock_send_email = AsyncMock()
    monkeypatch.setattr(auth_router, "send_password_reset_email", mock_send_email)

    response = client.post("/auth/forgot-password", json={"email": "user@example.com"})

    assert response.status_code == 200
    assert "лист із інструкціями" in response.json()["message"]

    # Verify token stored in Redis
    assert any(k.startswith("pwd_reset:") for k in mock_redis.store)
    mock_send_email.assert_awaited_once()


@pytest.mark.asyncio
async def test_forgot_password_keeps_generic_response_on_backend_failure(
    monkeypatch, mock_db, mock_redis
):
    user = User(id=uuid.uuid4(), email="user@example.com", is_active=True)
    mock_execute_result = MagicMock()
    mock_execute_result.scalar_one_or_none.return_value = user
    mock_db.execute.return_value = mock_execute_result
    mock_redis.setex = AsyncMock(side_effect=RuntimeError("redis unavailable"))
    monkeypatch.setattr(auth_router, "send_password_reset_email", AsyncMock())

    response = client.post("/auth/forgot-password", json={"email": "user@example.com"})

    assert response.status_code == 200
    assert "лист із інструкціями" in response.json()["message"]


@pytest.mark.asyncio
async def test_reset_password_success(monkeypatch, mock_db, mock_redis):
    # Populate redis reset token
    token = "recovery-token-xyz"
    reset_key = auth_router._password_reset_key(token)
    mock_redis.store[reset_key] = "user@example.com"

    # Mock user query to return active user
    user = User(id=uuid.uuid4(), email="user@example.com", is_active=True)
    mock_execute_result = MagicMock()
    mock_execute_result.scalar_one_or_none.return_value = user
    mock_db.execute.return_value = mock_execute_result

    response = client.post(
        "/auth/reset-password",
        json={"token": token, "email": "user@example.com", "new_password": "NewSecurePassword123!"},
    )

    assert response.status_code == 200
    assert "Пароль успішно оновлено" in response.json()["message"]

    # Verify password was updated, committed, and token deleted from Redis
    assert user.hashed_password != "OAUTH_NO_PASSWORD"
    assert user.token_version == 1
    mock_db.commit.assert_awaited_once()
    assert reset_key not in mock_redis.store


@pytest.mark.asyncio
async def test_reset_password_expired_token(monkeypatch, mock_db, mock_redis):
    # Call with non-existent token
    response = client.post(
        "/auth/reset-password",
        json={
            "token": "expired-token",
            "email": "user@example.com",
            "new_password": "NewSecurePassword123!",
        },
    )

    assert response.status_code == 400
    assert "Недійсний або прострочений" in response.json()["detail"]
    mock_db.commit.assert_not_called()


def test_logout_fails_closed_when_refresh_cannot_be_revoked(monkeypatch):
    monkeypatch.setattr(
        auth_router,
        "decode_token",
        lambda _: {
            "jti": "logout-jti",
            "exp": datetime.datetime.now(datetime.UTC).timestamp() + 300,
        },
    )
    monkeypatch.setattr(auth_router, "blacklist_token", AsyncMock(return_value=False))
    client.cookies.set("refresh_token", "dummy-refresh-token")

    response = client.post("/auth/logout")

    assert response.status_code == 503
    client.cookies.clear()


# --- Refresh Token Rotation ---


@pytest.mark.asyncio
async def test_refresh_token_rotation_success(monkeypatch, mock_db, mock_redis):
    # Prepare refresh token payload
    user_id = str(uuid.uuid4())
    old_jti = "old-jti-token-xyz"

    # Mock decode_token
    monkeypatch.setattr(
        auth_router,
        "decode_token",
        lambda token: {
            "sub": user_id,
            "type": "refresh",
            "jti": old_jti,
            "role": "user",
            "ver": 0,
            "exp": datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=1),
        },
    )

    # Mock user query
    user = User(
        id=uuid.UUID(user_id),
        email="user@example.com",
        role="user",
        is_active=True,
        token_version=0,
    )
    mock_execute_result = MagicMock()
    mock_execute_result.scalar_one_or_none.return_value = user
    mock_db.execute.return_value = mock_execute_result

    # Send refresh request
    client.cookies.set("refresh_token", "dummy-refresh-token")
    response = client.post("/auth/refresh")

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data

    # Verify old refresh token JTI is blacklisted
    assert f"token:blacklist:{old_jti}" in mock_redis.store


@pytest.mark.asyncio
async def test_refresh_token_blacklisted_rejected(monkeypatch, mock_db, mock_redis):
    user_id = str(uuid.uuid4())
    blacklisted_jti = "blacklisted-jti-xyz"

    # Mock decode_token
    monkeypatch.setattr(
        auth_router,
        "decode_token",
        lambda token: {
            "sub": user_id,
            "type": "refresh",
            "jti": blacklisted_jti,
            "role": "user",
            "ver": 0,
            "exp": datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=1),
        },
    )

    # Blacklist the JTI
    mock_redis.store[f"token:blacklist:{blacklisted_jti}"] = "1"

    # Send refresh request
    client.cookies.set("refresh_token", "dummy-refresh-token")
    response = client.post("/auth/refresh")

    # Rejected with 401
    assert response.status_code == 401
    assert "revoked" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_refresh_token_version_mismatch_rejected(monkeypatch, mock_db, mock_redis):
    user_id = str(uuid.uuid4())
    monkeypatch.setattr(
        auth_router,
        "decode_token",
        lambda token: {
            "sub": user_id,
            "type": "refresh",
            "jti": "stale-session-jti",
            "role": "user",
            "ver": 2,
            "exp": datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=1),
        },
    )
    user = User(
        id=uuid.UUID(user_id),
        email="user@example.com",
        role="user",
        is_active=True,
        token_version=3,
    )
    mock_execute_result = MagicMock()
    mock_execute_result.scalar_one_or_none.return_value = user
    mock_db.execute.return_value = mock_execute_result

    client.cookies.set("refresh_token", "dummy-refresh-token")
    response = client.post("/auth/refresh")

    assert response.status_code == 401
    assert "revoked" in response.json()["detail"].lower()
