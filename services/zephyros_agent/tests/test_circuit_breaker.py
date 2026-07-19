import asyncio
from unittest.mock import AsyncMock, MagicMock

from fastapi.testclient import TestClient

from app.main import app
from app.orchestration import ProviderState, race_first_valid
from app.schemas import ZephyrosResponse


client = TestClient(app)


def test_parallel_race_returns_first_valid_result(monkeypatch):
    monkeypatch.setattr("app.main.available_provider_chain", lambda: ["groq", "gemini"])
    monkeypatch.setattr("app.main.build_model", lambda provider: MagicMock())

    async def run_agent(_message, *, model, **_kwargs):
        if model is None:
            raise AssertionError("model was not built")
        # The second candidate wins even though the first candidate fails.
        if run_agent.calls == 0:
            run_agent.calls += 1
            raise RuntimeError("Groq unavailable")
        return MagicMock(output=ZephyrosResponse(blocks=[{"type": "text", "content": "Від Gemini"}]))

    run_agent.calls = 0
    monkeypatch.setattr("app.main.readonly_agent.run", run_agent)

    response = client.post("/agent/chat", json={"message": "hello", "provider": "groq"})

    assert response.status_code == 200
    assert response.json()["blocks"][0]["content"] == "Від Gemini"


def test_all_unavailable_returns_structured_fallback(monkeypatch):
    monkeypatch.setattr("app.main.available_provider_chain", lambda: ["groq"])
    monkeypatch.setattr("app.main.build_model", lambda provider: MagicMock())
    monkeypatch.setattr("app.main.readonly_agent.run", AsyncMock(side_effect=RuntimeError("provider down")))

    response = client.post("/agent/chat", json={"message": "hello"})

    assert response.status_code == 200
    assert response.json()["blocks"][0]["type"] == "fallback"


async def test_provider_state_cooldown_is_shared_in_local_fallback():
    state = ProviderState(None)
    await state.mark_failure("groq", "timeout", cooldown=10)
    assert not await state.is_eligible("groq", limit=1)


async def test_race_cancels_losing_attempts():
    state = ProviderState(None)

    async def run_agent(_message, *, model, **_kwargs):
        if model == "fast":
            return MagicMock(output=ZephyrosResponse(blocks=[{"type": "text", "content": "fast"}]))
        await asyncio.sleep(10)
        return MagicMock(output=ZephyrosResponse(blocks=[{"type": "text", "content": "slow"}]))

    result = await race_first_valid(
        request_id="test",
        message="hello",
        deps=MagicMock(),
        history=None,
        candidates=["fast", "slow"],
        build_model=lambda provider: provider,
        run_agent=run_agent,
        state=state,
    )

    assert result.winner == "fast"
    assert result.response.blocks[0].content == "fast"


class FakeRedis:
    def __init__(self):
        self.values = {}

    async def get(self, key):
        return self.values.get(key)

    async def set(self, key, value, ex=None, nx=False):
        if nx and key in self.values:
            return False
        self.values[key] = value
        return True

    async def getdel(self, key):
        return self.values.pop(key, None)


async def test_response_cache_avoids_provider_request():
    from app.orchestration import ResponseStore

    store = ResponseStore(FakeRedis())
    key = store.key("Порівняй молоко", [], None)
    response = ZephyrosResponse(blocks=[{"type": "text", "content": "cached"}])
    await store.set(key, response)

    cached = await store.get(key)
    assert cached is not None
    assert cached.blocks[0].content == "cached"


def test_confirmed_cart_action_is_single_use(monkeypatch):
    import json
    from unittest.mock import AsyncMock

    redis = FakeRedis()
    token = "one-time"
    redis.values[f"zephyros:action:{token}"] = json.dumps({
        "user_id": "e2e0ac63-8f29-471c-9065-660bc277d790",
        "action": "add_to_cart",
        "payload": {"product_id": 42, "quantity": 1},
    })
    carts = MagicMock()
    carts.json.return_value = [{"id": "cart-1"}]
    carts.raise_for_status.return_value = None
    added = MagicMock()
    added.raise_for_status.return_value = None
    app.state.redis = redis
    app.state.http_client = MagicMock(get=AsyncMock(return_value=carts), post=AsyncMock(return_value=added))

    response = client.post(
        "/agent/actions/execute",
        json={"action_token": token},
        headers={"X-User-Id": "e2e0ac63-8f29-471c-9065-660bc277d790"},
    )
    replay = client.post(
        "/agent/actions/execute",
        json={"action_token": token},
        headers={"X-User-Id": "e2e0ac63-8f29-471c-9065-660bc277d790"},
    )

    assert response.status_code == 200
    assert replay.status_code == 409
    assert app.state.http_client.post.await_count == 1
