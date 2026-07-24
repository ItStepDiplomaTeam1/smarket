import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock
from app.deps import AgentDeps
from app.read_context import build_read_context, _is_simple_search_query
from app.config import settings

@pytest.mark.asyncio
async def test_is_simple_search_query():
    assert _is_simple_search_query("молоко") is True
    assert _is_simple_search_query("молоко селянське") is True
    assert _is_simple_search_query("як додати товар?") is False
    assert _is_simple_search_query("доставка") is False
    assert _is_simple_search_query("хліб") is True
    assert _is_simple_search_query("що ти вмієш") is False


@pytest.mark.asyncio
async def test_build_read_context_simple_search_skips_llm(monkeypatch):
    mock_prepare = AsyncMock()
    monkeypatch.setattr("app.read_context._prepare_catalog", mock_prepare)

    mock_agent_instance = MagicMock()
    mock_agent_class = MagicMock(return_value=mock_agent_instance)
    monkeypatch.setattr("pydantic_ai.Agent", mock_agent_class)

    deps = AgentDeps(http_client=MagicMock(), redis_client=None, user_id=None)
    
    # Reset mock after import/initialization
    mock_agent_class.reset_mock()
    
    await build_read_context("молоко селянське", deps, request_id="req-1")

    mock_agent_class.assert_not_called()
    mock_prepare.assert_called_once()


@pytest.mark.asyncio
async def test_build_read_context_chitchat_routes_to_none(monkeypatch):
    mock_run_result = MagicMock()
    mock_run_result.data = "none"
    
    mock_agent_instance = MagicMock()
    mock_agent_instance.run = AsyncMock(return_value=mock_run_result)
    
    mock_agent_class = MagicMock(return_value=mock_agent_instance)
    monkeypatch.setattr("pydantic_ai.Agent", mock_agent_class)

    monkeypatch.setattr("app.agent.zephyros.available_provider_chain", lambda: ["groq-llama"])
    monkeypatch.setattr("app.agent.zephyros.build_model", lambda p: MagicMock())

    deps = AgentDeps(http_client=MagicMock(), redis_client=None, user_id=None)
    
    # Reset mock after import/initialization
    mock_agent_class.reset_mock()

    context = await build_read_context("розкажи мені про доставку", deps, request_id="req-2")

    mock_agent_class.assert_called_once()
    assert context.intent == "none"


@pytest.mark.asyncio
async def test_build_read_context_uses_redis_cache(monkeypatch):
    redis_client = MagicMock()
    redis_client.get = AsyncMock(return_value=b"none")

    mock_agent_instance = MagicMock()
    mock_agent_class = MagicMock(return_value=mock_agent_instance)
    monkeypatch.setattr("pydantic_ai.Agent", mock_agent_class)

    deps = AgentDeps(http_client=MagicMock(), redis_client=redis_client, user_id=None)
    
    # Reset mock after import/initialization
    mock_agent_class.reset_mock()

    context = await build_read_context("розкажи мені про доставку", deps, request_id="req-3")

    redis_client.get.assert_called_once()
    mock_agent_class.assert_not_called()
    assert context.intent == "none"


@pytest.mark.asyncio
async def test_build_read_context_defaults_on_timeout(monkeypatch):
    async def simulate_timeout(*args, **kwargs):
        raise asyncio.TimeoutError()

    mock_agent_instance = MagicMock()
    mock_agent_instance.run = AsyncMock(side_effect=simulate_timeout)
    
    mock_agent_class = MagicMock(return_value=mock_agent_instance)
    monkeypatch.setattr("pydantic_ai.Agent", mock_agent_class)

    monkeypatch.setattr("app.agent.zephyros.available_provider_chain", lambda: ["groq-llama"])
    monkeypatch.setattr("app.agent.zephyros.build_model", lambda p: MagicMock())

    mock_prepare = AsyncMock()
    monkeypatch.setattr("app.read_context._prepare_catalog", mock_prepare)

    deps = AgentDeps(http_client=MagicMock(), redis_client=None, user_id=None)
    
    # Reset mock after import/initialization
    mock_agent_class.reset_mock()

    await build_read_context("розкажи мені про доставку", deps, request_id="req-4")

    mock_agent_class.assert_called_once()
    mock_prepare.assert_called_once()


@pytest.mark.asyncio
async def test_build_read_context_geopolitical_crimea():
    deps = AgentDeps(http_client=MagicMock(), redis_client=None, user_id=None)
    context = await build_read_context("Крим", deps, request_id="req-geo-1")
    assert context.intent == "none"
    assert context.direct_response is not None
    text_blocks = [b for b in context.direct_response.blocks if b.type == "text"]
    assert len(text_blocks) == 1
    assert "Крим — це Україна!" in text_blocks[0].content
    assert "Слава Україні!" in text_blocks[0].content


@pytest.mark.asyncio
async def test_build_read_context_geopolitical_russia():
    deps = AgentDeps(http_client=MagicMock(), redis_client=None, user_id=None)
    context = await build_read_context("Росія", deps, request_id="req-geo-2")
    assert context.intent == "none"
    assert context.direct_response is not None
    text_blocks = [b for b in context.direct_response.blocks if b.type == "text"]
    assert len(text_blocks) == 1
    assert "Росія — це країна-терорист" in text_blocks[0].content
    assert "Росії не повинно існувати" in text_blocks[0].content
    assert "Слава Україні!" in text_blocks[0].content
