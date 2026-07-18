import pytest
import jwt
import httpx
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

@pytest.fixture
def setup_gateway():
    captured_requests = []
    
    # Create mock response that supports aiter_raw
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.headers = httpx.Headers({"content-type": "application/json"})
    
    async def mock_aiter_raw():
        yield b'{"status": "ok_downstream"}'
        
    mock_response.aiter_raw.return_value = mock_aiter_raw()
    
    async def mock_send(request, *args, **kwargs):
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
    monkeypatch.setattr("jwt.decode", lambda token, key, algorithms: {
        "sub": "e2e0ac63-8f29-471c-9065-660bc277d790",
        "role": "admin",
        "type": "access"
    })
    
    response = client.get(
        "/api/v1/admin/audit",
        headers={"Authorization": "Bearer valid-admin-token"}
    )
    
    assert response.status_code == 200
    assert response.json() == {"status": "ok_downstream"}
    assert len(captured) == 1
    assert captured[0].headers.get("X-User-Id") == "e2e0ac63-8f29-471c-9065-660bc277d790"
    assert captured[0].headers.get("X-User-Role") == "admin"

def test_expired_token_rejection(monkeypatch, setup_gateway):
    captured = setup_gateway
    
    def mock_decode_expired(*args, **kwargs):
        raise jwt.ExpiredSignatureError("Token has expired")
    monkeypatch.setattr("jwt.decode", mock_decode_expired)
    
    response = client.get(
        "/api/v1/admin/audit",
        headers={"Authorization": "Bearer expired-token"}
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
        "/api/v1/admin/audit",
        headers={"Authorization": "InvalidFormatToken"}
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

def test_admin_route_regular_user_forbidden(monkeypatch, setup_gateway):
    captured = setup_gateway
    
    monkeypatch.setattr("jwt.decode", lambda token, key, algorithms: {
        "sub": "e2e0ac63-8f29-471c-9065-660bc277d790",
        "role": "user",
        "type": "access"
    })
    
    response = client.get(
        "/api/v1/admin/audit",
        headers={"Authorization": "Bearer regular-user-token"}
    )
    
    assert response.status_code == 403
    assert len(captured) == 0

def test_downstream_service_unreachable(setup_gateway):
    
    # Append 'connect-error' to trigger ConnectError in mock transport
    response = client.get("/api/v1/products/connect-error")
    assert response.status_code == 503
    assert "недоступний" in response.json()["detail"] or "unavailable" in response.json()["detail"].lower()
