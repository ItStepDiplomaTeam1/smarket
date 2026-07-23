import pytest
import jwt
import httpx
import json
import os
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient

os.environ.setdefault("ETL_ADMIN_KEY", "test-etl-admin-key-32-bytes-long!!")

from app.main import app
from app.api.core.config import Settings, settings

client = TestClient(app)


def test_production_cors_rejects_wildcards():
    configured = Settings(
        JWT_SECRET_KEY="j" * 32,
        ETL_ADMIN_KEY="e" * 32,
        ENV="production",
        CORS_ORIGINS="*",
    )

    with pytest.raises(ValueError, match="Invalid CORS origin"):
        _ = configured.allowed_cors_origins


@pytest.fixture
def setup_gateway():
    captured_requests = []

    # Create mock response that supports aiter_raw
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.headers = httpx.Headers({"content-type": "application/json"})
    mock_response.json.return_value = {"status": "ok"}

    async def mock_aiter_raw():
        yield b'{"status": "ok_downstream"}'

    mock_response.aiter_raw.return_value = mock_aiter_raw()

    async def mock_send(request, *args, **kwargs):
        await request.aread()
        captured_requests.append(request)
        if "connect-error" in str(request.url):
            raise httpx.ConnectError("Connection refused")
        return mock_response

    # Assign mocked AsyncClient to app state
    app.state.http_client = MagicMock(spec=httpx.AsyncClient)
    app.state.http_client.build_request = httpx.AsyncClient().build_request
    app.state.http_client.send = mock_send

    app.state.auth_http_client = MagicMock(spec=httpx.AsyncClient)
    app.state.auth_http_client.build_request = httpx.AsyncClient().build_request
    app.state.auth_http_client.send = mock_send

    yield captured_requests


def test_valid_access_token_passes_through(monkeypatch, setup_gateway):
    captured = setup_gateway

    # Mock jwt.decode to return valid admin payload
    monkeypatch.setattr(
        "jwt.decode",
        lambda token, key, algorithms: {
            "sub": "e2e0ac63-8f29-471c-9065-660bc277d790",
            "role": "admin",
            "type": "access",
        },
    )

    response = client.get(
        "/api/v1/admin/audit", headers={"Authorization": "Bearer valid-admin-token"}
    )

    assert response.status_code == 200
    assert response.json() == {"status": "ok_downstream"}
    assert len(captured) == 1
    assert (
        captured[0].headers.get("X-User-Id") == "e2e0ac63-8f29-471c-9065-660bc277d790"
    )
    assert captured[0].headers.get("X-User-Role") == "admin"


def test_expired_token_rejection(monkeypatch, setup_gateway):
    captured = setup_gateway

    def mock_decode_expired(*args, **kwargs):
        raise jwt.ExpiredSignatureError("Token has expired")

    monkeypatch.setattr("jwt.decode", mock_decode_expired)

    response = client.get(
        "/api/v1/admin/audit", headers={"Authorization": "Bearer expired-token"}
    )

    assert response.status_code == 401
    assert len(captured) == 0


def test_malformed_token_rejection(setup_gateway):
    captured = setup_gateway

    # Missing Authorization header
    response = client.get("/api/v1/admin/audit")
    assert response.status_code == 401
    assert len(captured) == 0

    # Invalid Authorization format
    response = client.get(
        "/api/v1/admin/audit", headers={"Authorization": "InvalidFormatToken"}
    )
    assert response.status_code == 401
    assert len(captured) == 0


def test_public_route_bypass_jwt(setup_gateway):
    captured = setup_gateway

    # GET products does not require JWT verification
    response = client.get("/api/v1/products")
    assert response.status_code == 200
    assert len(captured) == 1
    # Check that it proxied to product service
    assert "products" in str(captured[0].url)


def test_search_mutations_are_not_exposed(setup_gateway):
    captured = setup_gateway

    post_response = client.post("/api/v1/search/index", json={"documents": []})
    delete_response = client.delete("/api/v1/search/index/123")

    assert post_response.status_code == 405
    assert delete_response.status_code == 405
    assert len(captured) == 0


def test_refresh_rejects_cross_site_browser_request(setup_gateway):
    captured = setup_gateway
    response = client.post(
        "/api/v1/auth/refresh",
        headers={
            "Origin": "https://evil.example",
            "Sec-Fetch-Site": "cross-site",
        },
    )

    assert response.status_code == 403
    assert len(captured) == 0


def test_auth_responses_are_not_cacheable(setup_gateway):
    response = client.post(
        "/api/v1/auth/login",
        headers={"Origin": "https://smarket-7go.pages.dev"},
        json={"email": "user@example.com", "password": "not-a-real-password"},
    )

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"


def test_user_lookup_requires_authentication(setup_gateway):
    captured = setup_gateway

    response = client.get("/api/v1/auth/users/00000000-0000-0000-0000-000000000000")

    assert response.status_code == 401
    assert len(captured) == 0


def test_shared_cart_is_public_and_strips_authorization(setup_gateway):
    captured = setup_gateway

    response = client.get(
        "/api/v1/cart/shared/349fd043-4712-4fb8-9c48-e8cb9a712f5a",
        headers={"Authorization": "Bearer must-not-be-forwarded"},
    )

    assert response.status_code == 200
    assert len(captured) == 1
    assert "cart/shared/349fd043-4712-4fb8-9c48-e8cb9a712f5a" in str(captured[0].url)
    assert captured[0].headers.get("Authorization") is None


def test_admin_route_regular_user_forbidden(monkeypatch, setup_gateway):
    captured = setup_gateway

    monkeypatch.setattr(
        "jwt.decode",
        lambda token, key, algorithms: {
            "sub": "e2e0ac63-8f29-471c-9065-660bc277d790",
            "role": "user",
            "type": "access",
        },
    )

    response = client.get(
        "/api/v1/admin/audit", headers={"Authorization": "Bearer regular-user-token"}
    )

    assert response.status_code == 403
    assert len(captured) == 0


def test_gateway_injects_etl_key_server_side(monkeypatch, setup_gateway):
    captured = setup_gateway
    monkeypatch.setattr(
        "jwt.decode",
        lambda token, key, algorithms: {
            "sub": "e2e0ac63-8f29-471c-9065-660bc277d790",
            "role": "admin",
            "type": "access",
        },
    )

    response = client.post(
        "/api/v1/admin/etl/control",
        headers={
            "Authorization": "Bearer admin-token",
            "X-Admin-Key": "attacker-controlled",
        },
        json={"action": "stop"},
    )

    assert response.status_code == 200
    assert len(captured) == 1
    assert captured[0].headers["x-admin-key"] == settings.ETL_ADMIN_KEY


def test_downstream_service_unreachable(setup_gateway):

    # Append 'connect-error' to trigger ConnectError in mock transport
    response = client.get("/api/v1/products/connect-error")
    assert response.status_code == 503
    assert (
        "недоступний" in response.json()["detail"]
        or "unavailable" in response.json()["detail"].lower()
    )


def test_agent_proxy_preserves_request_id_and_legacy_body(monkeypatch, setup_gateway):
    captured = setup_gateway
    monkeypatch.setattr(
        "jwt.decode",
        lambda token, key, algorithms: {
            "sub": "e2e0ac63-8f29-471c-9065-660bc277d790",
            "role": "user",
            "type": "access",
        },
    )

    response = client.post(
        "/api/v1/agent/chat",
        headers={
            "Authorization": "Bearer user-token",
            "X-Request-Id": "request-from-browser",
        },
        json={
            "message": "Порівняй молоко",
            "provider": "legacy-provider",
            "model_name": "legacy-model",
        },
    )

    assert response.status_code == 200
    assert len(captured) == 1
    downstream = captured[0]
    assert downstream.headers["X-Request-Id"] == "request-from-browser"
    assert downstream.headers["X-User-Id"] == "e2e0ac63-8f29-471c-9065-660bc277d790"
    assert json.loads(downstream.content) == {
        "message": "Порівняй молоко",
        "provider": "legacy-provider",
        "model_name": "legacy-model",
    }


def test_agent_proxy_never_exposes_raw_provider_errors(monkeypatch, setup_gateway):
    monkeypatch.setattr(
        "jwt.decode",
        lambda token, key, algorithms: {
            "sub": "e2e0ac63-8f29-471c-9065-660bc277d790",
            "role": "user",
            "type": "access",
        },
    )
    upstream = MagicMock(spec=httpx.Response)
    upstream.status_code = 502
    upstream.headers = httpx.Headers({"content-type": "application/json"})
    upstream.aread = AsyncMock(
        return_value=b'{"detail":"openrouter invalid key sk-secret","model":"private-model"}'
    )
    upstream.aclose = AsyncMock()
    app.state.http_client.send = AsyncMock(return_value=upstream)

    response = client.post(
        "/api/v1/agent/chat",
        headers={"Authorization": "Bearer user-token"},
        json={"message": "hello"},
    )

    assert response.status_code == 502
    serialized = json.dumps(response.json()).casefold()
    assert "openrouter" not in serialized
    assert "private-model" not in serialized
    assert "sk-secret" not in serialized
