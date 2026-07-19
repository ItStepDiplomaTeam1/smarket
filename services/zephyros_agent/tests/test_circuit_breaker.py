import asyncio
from unittest.mock import AsyncMock, MagicMock

from fastapi.testclient import TestClient
from pydantic_ai.exceptions import ModelHTTPError

from app.config import settings
from app.main import app
from app.orchestration import (
    ProviderState,
    ResponseStore,
    RoutingMetrics,
    classify_failure,
    race_first_valid,
)
from app.schemas import ZephyrosResponse


client = TestClient(app)


def test_parallel_race_returns_first_valid_result(monkeypatch):
    monkeypatch.setattr("app.main.available_provider_chain", lambda: ["groq", "gemini"])
    monkeypatch.setattr("app.main.build_model", lambda provider: provider)
    started = set()

    async def run_agent(_message, *, model, **_kwargs):
        started.add(model)
        # The second candidate wins even though the first candidate fails.
        if model == "groq":
            raise RuntimeError("Groq unavailable")
        return MagicMock(output=ZephyrosResponse(blocks=[{"type": "text", "content": "Від Gemini"}]))

    monkeypatch.setattr("app.main.readonly_agent.run", run_agent)

    response = client.post("/agent/chat", json={"message": "hello", "provider": "groq"})

    assert response.status_code == 200
    assert response.json()["blocks"][0]["content"] == "Від Gemini"
    assert started == {"groq", "gemini"}


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


async def test_local_half_open_allows_only_one_probe():
    state = ProviderState(None)
    await state.mark_failure("groq", "timeout", cooldown=0.01)
    await asyncio.sleep(0.02)

    assert await state.acquire("groq", limit=2)
    assert not await state.acquire("groq", limit=2)

    await state.mark_success("groq")
    await state.release("groq")
    assert await state.acquire("groq", limit=2)


async def test_provider_concurrency_limit_is_enforced():
    state = ProviderState(None)

    assert await state.acquire("groq", limit=1)
    assert not await state.acquire("groq", limit=1)
    await state.release("groq")
    assert await state.acquire("groq", limit=1)


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


async def test_simultaneous_valid_results_use_registry_priority():
    release = asyncio.Event()

    async def run_agent(_message, *, model, **_kwargs):
        await release.wait()
        return MagicMock(
            output=ZephyrosResponse(blocks=[{"type": "text", "content": model}])
        )

    race = asyncio.create_task(
        race_first_valid(
            request_id="tie",
            message="hello",
            deps=MagicMock(),
            history=None,
            candidates=["higher-priority", "lower-priority"],
            build_model=lambda provider: provider,
            run_agent=run_agent,
            state=ProviderState(None),
        )
    )
    await asyncio.sleep(0)
    release.set()
    result = await race

    assert result.winner == "higher-priority"
    assert result.response.blocks[0].content == "higher-priority"


async def test_timeout_and_malformed_candidates_lose_to_valid_candidate():
    state = ProviderState(None)

    async def run_agent(_message, *, model, **_kwargs):
        if model == "timeout":
            await asyncio.sleep(1)
        if model == "malformed":
            return {"blocks": [{"type": "text"}]}
        return MagicMock(
            output=ZephyrosResponse(blocks=[{"type": "text", "content": "valid"}])
        )

    result = await race_first_valid(
        request_id="fault-race",
        message="hello",
        deps=MagicMock(),
        history=None,
        candidates=["timeout", "malformed", "valid"],
        build_model=lambda provider: provider,
        run_agent=run_agent,
        state=state,
    )

    assert result.winner == "valid"
    assert result.response.blocks[0].content == "valid"


def test_provider_http_failures_are_classified():
    assert classify_failure(ModelHTTPError(401, "model")) == "auth"
    assert classify_failure(ModelHTTPError(429, "model")) == "rate_limit"
    assert classify_failure(ModelHTTPError(503, "model")) == "provider_5xx"
    assert classify_failure(asyncio.TimeoutError()) == "timeout"


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
    store = ResponseStore(FakeRedis())
    key = store.key("Порівняй молоко", [], None)
    response = ZephyrosResponse(blocks=[{"type": "text", "content": "cached"}])
    await store.set(key, response)

    cached = await store.get(key)
    assert cached is not None
    assert cached.blocks[0].content == "cached"


def test_chat_cache_hit_skips_context_and_provider(monkeypatch):
    redis = FakeRedis()
    store = ResponseStore(redis)
    base_key = store.key("Порівняй молоко", [], None)
    cache_key = asyncio.run(store.versioned_key(base_key, user_scope=None))
    cached = ZephyrosResponse(blocks=[{"type": "text", "content": "cached endpoint"}])
    asyncio.run(store.set(cache_key, cached))
    context_builder = AsyncMock(side_effect=AssertionError("cache hit rebuilt context"))
    provider_chain = MagicMock(side_effect=AssertionError("cache hit started providers"))
    app.state.redis = redis
    app.state.response_store = store
    app.state.provider_state = ProviderState(redis)
    app.state.routing_metrics = RoutingMetrics(None)
    monkeypatch.setattr("app.main.build_read_context", context_builder)
    monkeypatch.setattr("app.main.available_provider_chain", provider_chain)

    response = client.post("/agent/chat", json={"message": "Порівняй молоко"})

    assert response.status_code == 200
    assert response.json()["blocks"][0]["content"] == "cached endpoint"
    context_builder.assert_not_awaited()
    provider_chain.assert_not_called()


class CaptureMetrics:
    def __init__(self):
        self.counters = []

    async def increment(self, name, value=1, labels=None):
        self.counters.append((name, value, labels or {}))

    async def observe_ms(self, *_args, **_kwargs):
        return None


async def test_prompt_budget_and_token_accounting(monkeypatch):
    monkeypatch.setattr(settings, "CHAT_MAX_CONTEXT_CHARS", 32)
    monkeypatch.setattr(settings, "CHAT_MAX_OUTPUT_TOKENS", 77)
    captured = {}
    metrics = CaptureMetrics()

    class Usage:
        input_tokens = 23
        output_tokens = 11

    class AgentResult:
        output = ZephyrosResponse(blocks=[{"type": "text", "content": "bounded"}])

        @staticmethod
        def usage():
            return Usage()

    async def run_agent(message, **kwargs):
        captured["message"] = message
        captured["model_settings"] = kwargs["model_settings"]
        return AgentResult()

    result = await race_first_valid(
        request_id="budget",
        message="x" * 200,
        deps=MagicMock(),
        history=None,
        candidates=["stable"],
        build_model=lambda provider: provider,
        run_agent=run_agent,
        state=ProviderState(None),
        metrics=metrics,
    )

    assert result.winner == "stable"
    assert captured["message"] == "x" * 32
    assert captured["model_settings"] == {"max_tokens": 77}
    observed = {name: value for name, value, _labels in metrics.counters}
    assert observed["prompt_tokens_estimated_total"] == 8
    assert observed["output_tokens_requested_total"] == 77
    assert observed["output_tokens_estimated_total"] > 0
    assert observed["provider_reported_input_tokens_total"] == 23
    assert observed["provider_reported_output_tokens_total"] == 11


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
