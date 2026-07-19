from unittest.mock import MagicMock

from app.agent import zephyros
from app.config import settings


def test_registry_has_unique_deterministic_priorities():
    names = [candidate.name for candidate in zephyros.PROVIDER_REGISTRY]
    priorities = [candidate.priority for candidate in zephyros.PROVIDER_REGISTRY]

    assert len(names) == len(set(names))
    assert priorities == sorted(priorities)
    assert all(candidate.timeout_seconds > 0 for candidate in zephyros.PROVIDER_REGISTRY)
    assert all(candidate.concurrency_limit > 0 for candidate in zephyros.PROVIDER_REGISTRY)


def test_available_chain_only_contains_configured_providers(monkeypatch):
    monkeypatch.setattr(settings, "GROQ_API_KEY", "groq-key")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", None)
    monkeypatch.setattr(settings, "CEREBRAS_API_KEY", None)
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", None)

    assert zephyros.available_provider_chain() == ["groq-gpt-oss", "groq-llama"]


def test_build_model_translates_deprecated_gemini_model(monkeypatch):
    model = MagicMock()
    google_model = MagicMock(return_value=model)
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(zephyros, "GoogleModel", google_model)

    assert zephyros.build_model("gemini", "gemini-2.5-flash") is model
    google_model.assert_called_once_with("gemini-3.5-flash")


def test_build_model_keeps_gpt_oss_and_translates_deprecated_cerebras_model(monkeypatch):
    openai_model = MagicMock()
    cerebras_model = MagicMock()
    monkeypatch.setattr(settings, "GROQ_API_KEY", "test-key")
    monkeypatch.setattr(settings, "CEREBRAS_API_KEY", "test-key")
    monkeypatch.setattr(zephyros, "OpenAIChatModel", openai_model)
    monkeypatch.setattr(zephyros, "CerebrasModel", cerebras_model)

    zephyros.build_model("groq", "openai/gpt-oss-20b")
    zephyros.build_model("cerebras", "qwen3")

    assert openai_model.call_args.kwargs["model_name"] == "openai/gpt-oss-20b"
    assert cerebras_model.call_args.kwargs["model_name"] == "gpt-oss-120b"


def test_build_model_translates_deprecated_openrouter_env_model(monkeypatch):
    openai_model = MagicMock()
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "test-key")
    monkeypatch.setattr(
        settings,
        "OPENROUTER_MODEL",
        "meta-llama/llama-3.3-70b-instruct:free",
    )
    monkeypatch.setattr(zephyros, "OpenAIChatModel", openai_model)

    zephyros.build_model("openrouter")

    assert openai_model.call_args.kwargs["model_name"] == "openrouter/free"
