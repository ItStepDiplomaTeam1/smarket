import pytest
import time
import httpx
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient

from app.main import app, _provider_down_until
from app.schemas import ZephyrosResponse

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_circuit_breaker():
    _provider_down_until.clear()
    app.state.http_client = MagicMock(spec=httpx.AsyncClient)
    app.state.redis = MagicMock()
    yield
    _provider_down_until.clear()

def test_circuit_breaker_primary_fails_fallback_used(monkeypatch):
    # Mock provider chain resolution to return ["groq", "gemini"]
    monkeypatch.setattr("app.main.available_provider_chain", lambda: ["groq", "gemini"])
    
    # Mock build_model to return a dummy model
    monkeypatch.setattr("app.main.build_model", lambda prov, model_name=None: MagicMock())
    
    # Mock agent.run
    # First call (groq) raises exception to trigger fallback
    # Second call (gemini) succeeds
    mock_run = AsyncMock()
    mock_output = MagicMock()
    mock_output.output = ZephyrosResponse(blocks=[{"type": "text", "content": "Hello from Gemini"}])
    mock_run.side_effect = [Exception("Groq error"), mock_output]
    monkeypatch.setattr("app.main.agent.run", mock_run)
    
    response = client.post("/agent/chat", json={"message": "hello"})
    
    assert response.status_code == 200
    assert response.json()["blocks"][0]["content"] == "Hello from Gemini"
    
    # Verify groq was marked down in cooldown
    assert "groq" in _provider_down_until
    assert _provider_down_until["groq"] > time.monotonic()
    
    # Verify gemini is NOT marked down
    assert "gemini" not in _provider_down_until

def test_circuit_breaker_all_providers_in_cooldown(monkeypatch):
    monkeypatch.setattr("app.main.available_provider_chain", lambda: ["groq", "gemini"])
    monkeypatch.setattr("app.main.build_model", lambda prov, model_name=None: MagicMock())
    
    # Mark both groq and gemini as down
    _provider_down_until["groq"] = time.monotonic() + 300
    _provider_down_until["gemini"] = time.monotonic() + 300
    
    mock_run = AsyncMock()
    monkeypatch.setattr("app.main.agent.run", mock_run)
    
    response = client.post("/agent/chat", json={"message": "hello"})
    
    # Returns 503 since all providers are in cooldown
    assert response.status_code == 503
    assert response.json()["error"] == "all_providers_exhausted"
    
    # Verify agent.run was never called
    assert mock_run.call_count == 0

def test_circuit_breaker_cooldown_expiry_restores_provider(monkeypatch):
    monkeypatch.setattr("app.main.available_provider_chain", lambda: ["groq"])
    monkeypatch.setattr("app.main.build_model", lambda prov, model_name=None: MagicMock())
    
    # Set groq down but in the past (cooldown expired)
    _provider_down_until["groq"] = time.monotonic() - 10
    
    mock_run = AsyncMock()
    mock_output = MagicMock()
    mock_output.output = ZephyrosResponse(blocks=[{"type": "text", "content": "Hello from Groq"}])
    mock_run.return_value = mock_output
    monkeypatch.setattr("app.main.agent.run", mock_run)
    
    response = client.post("/agent/chat", json={"message": "hello"})
    
    # Groq is restored and gets called
    assert response.status_code == 200
    assert response.json()["blocks"][0]["content"] == "Hello from Groq"
    assert mock_run.call_count == 1
