from fastapi.testclient import TestClient

from services.auth_service.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_register_missing_body() -> None:
    response = client.post("/auth/register", json={})
    assert response.status_code == 422


def test_register_invalid_email() -> None:
    response = client.post(
        "/auth/register",
        json={"email": "not-an-email", "password": "validpass123"},
    )
    assert response.status_code == 422


def test_register_password_too_short() -> None:
    response = client.post(
        "/auth/register",
        json={"email": "user@example.com", "password": "short"},
    )
    assert response.status_code == 422


def test_login_missing_body() -> None:
    response = client.post("/auth/login", json={})
    assert response.status_code == 422


def test_me_no_token() -> None:
    response = client.get("/auth/me")
    assert response.status_code in (401, 403)


def test_refresh_no_cookie() -> None:
    response = client.post("/auth/refresh")
    assert response.status_code == 401


def test_logout() -> None:
    response = client.post("/auth/logout")
    assert response.status_code == 204


import pytest
from unittest.mock import AsyncMock, MagicMock
from services.auth_service.database.session import get_db
from services.auth_service.database.models import User
from services.auth_service.main import app
import services.auth_service.routers.auth as auth_router
from services.auth_service.plugins.security.limiters.auth_limiter import auth_limiter

auth_limiter._get().enabled = False


@pytest.mark.asyncio
async def test_register_success(monkeypatch: pytest.MonkeyPatch) -> None:
    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    mock_execute_result = MagicMock()
    mock_execute_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_execute_result

    mock_save_otp = AsyncMock()
    mock_send_otp_email = AsyncMock()
    monkeypatch.setattr(auth_router, "save_otp", mock_save_otp)
    monkeypatch.setattr(auth_router, "send_otp_email", mock_send_otp_email)

    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = client.post(
            "/auth/register",
            json={"email": "new_user@example.com", "password": "Password123!"},
        )
        assert response.status_code == 201
        data = response.json()
        assert "Verification email sent" in data["message"]
        assert data["email"] == "new_user@example.com"
        
        mock_db.add.assert_called_once()
        mock_db.commit.assert_awaited_once()
        mock_db.refresh.assert_awaited_once()
        
        mock_save_otp.assert_awaited_once()
        mock_send_otp_email.assert_awaited_once()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_register_verify_success(monkeypatch: pytest.MonkeyPatch) -> None:
    mock_user = User(
        id="e2e0ac63-8f29-471c-9065-660bc277d790",
        email="pending_user@example.com",
        hashed_password="hashed_password",
        role="user",
        is_active=False,
    )
    
    mock_db = AsyncMock()
    mock_execute_result = MagicMock()
    mock_execute_result.scalar_one_or_none.return_value = mock_user
    mock_db.execute.return_value = mock_execute_result

    mock_verify_otp = AsyncMock(return_value=True)
    mock_cache_auth_user = AsyncMock()
    monkeypatch.setattr(auth_router, "verify_otp", mock_verify_otp)
    monkeypatch.setattr(auth_router, "cache_auth_user", mock_cache_auth_user)

    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = client.post(
            "/auth/register/verify",
            json={"email": "pending_user@example.com", "code": "123456"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "pending_user@example.com"
        assert mock_user.is_active is True
        
        mock_db.commit.assert_awaited_once()
        mock_cache_auth_user.assert_awaited_once_with(mock_user)
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_register_verify_invalid_otp(monkeypatch: pytest.MonkeyPatch) -> None:
    mock_verify_otp = AsyncMock(return_value=False)
    monkeypatch.setattr(auth_router, "verify_otp", mock_verify_otp)

    response = client.post(
        "/auth/register/verify",
        json={"email": "pending_user@example.com", "code": "wrongcode"},
    )
    assert response.status_code == 400
    assert "Invalid or expired verification code" in response.json()["detail"]


@pytest.mark.asyncio
async def test_register_existing_active_user(monkeypatch: pytest.MonkeyPatch) -> None:
    mock_user = User(
        id="e2e0ac63-8f29-471c-9065-660bc277d790",
        email="active_user@example.com",
        hashed_password="hashed_password",
        role="user",
        is_active=True,
    )
    
    mock_db = AsyncMock()
    mock_execute_result = MagicMock()
    mock_execute_result.scalar_one_or_none.return_value = mock_user
    mock_db.execute.return_value = mock_execute_result

    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = client.post(
            "/auth/register",
            json={"email": "active_user@example.com", "password": "Password123!"},
        )
        assert response.status_code == 409
        assert "Email already registered" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_register_existing_inactive_user(monkeypatch: pytest.MonkeyPatch) -> None:
    mock_user = User(
        id="e2e0ac63-8f29-471c-9065-660bc277d790",
        email="inactive_user@example.com",
        hashed_password="old_hashed_password",
        role="user",
        is_active=False,
    )
    
    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    mock_execute_result = MagicMock()
    mock_execute_result.scalar_one_or_none.return_value = mock_user
    mock_db.execute.return_value = mock_execute_result

    mock_save_otp = AsyncMock()
    mock_send_otp_email = AsyncMock()
    monkeypatch.setattr(auth_router, "save_otp", mock_save_otp)
    monkeypatch.setattr(auth_router, "send_otp_email", mock_send_otp_email)

    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = client.post(
            "/auth/register",
            json={"email": "inactive_user@example.com", "password": "NewPassword123!"},
        )
        assert response.status_code == 201
        data = response.json()
        assert "Verification email sent" in data["message"]
        
        mock_db.add.assert_not_called()
        mock_db.commit.assert_awaited_once()
        
        assert mock_user.hashed_password != "old_hashed_password"
    finally:
        app.dependency_overrides.clear()

