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
