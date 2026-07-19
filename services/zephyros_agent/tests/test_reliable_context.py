import asyncio
import json
import uuid
from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest
from fastapi.testclient import TestClient

from app.deps import AgentDeps
from app.config import settings
from app.main import _slo_observation, app
from app.orchestration import (
    InvalidResponseError,
    ProviderState,
    ResponseStore,
    RoutingMetrics,
    valid_response,
)
from app.read_context import build_read_context, classify_intent
from app.schemas import ZephyrosResponse


USER_ID = uuid.UUID("e2e0ac63-8f29-471c-9065-660bc277d790")


def response_with_json(value):
    response = MagicMock()
    response.json.return_value = value
    response.raise_for_status.return_value = None
    return response


@pytest.mark.parametrize(
    "message",
    [
        "Порівняти мій кошик",
        "Сравни мою корзину по магазинам",
        "Где дешевле будет моя корзина?",
    ],
)
def test_cart_comparison_intent_is_language_tolerant(message):
    assert classify_intent(message) == "cart_comparison"


@pytest.mark.parametrize(
    ("message", "intent"),
    [
        ("Додай це морозиво до кошика", "cart_add"),
        ("Удали молоко из корзины", "cart_remove"),
        ("Очисти мою корзину", "cart_clear"),
        ("Привіт, що ти вмієш?", "none"),
    ],
)
def test_action_intents_do_not_fall_through_to_catalog_search(message, intent):
    assert classify_intent(message) == intent


async def test_cart_comparison_is_prepared_once_without_a_model():
    cart = {
        "id": "cart-1",
        "name": "Мій кошик",
        "items": [
            {
                "product_id": 42,
                "product_name": "Молоко",
                "quantity": 2,
                "price": 40.0,
            }
        ],
    }
    comparison = [
        {
            "store_id": "novus-1",
            "store_name": "Novus",
            "retail_chain": "novus",
            "total_price": 78.0,
            "found_items_count": 1,
            "missing_items_count": 0,
            "is_complete": True,
        },
        {
            "store_id": "metro-1",
            "store_name": "Metro",
            "retail_chain": "metro",
            "total_price": 82.0,
            "found_items_count": 1,
            "missing_items_count": 0,
            "is_complete": True,
        },
    ]
    client = MagicMock(
        get=AsyncMock(
            side_effect=[response_with_json([cart]), response_with_json(comparison)]
        )
    )

    prepared = await build_read_context(
        "Сравни мою корзину",
        AgentDeps(http_client=client, user_id=USER_ID),
        request_id="request-1",
    )

    assert prepared.direct_response is not None
    table = next(block for block in prepared.direct_response.blocks if block.type == "table")
    assert table.rows[0][0] == "Novus"
    assert table.highlight_row == 0
    assert client.get.await_count == 2


async def test_cart_comparison_timeout_returns_useful_cart_snapshot():
    cart = {
        "id": "cart-1",
        "name": "Мій кошик",
        "items": [
            {
                "product_id": 42,
                "product_name": "Молоко",
                "quantity": 2,
                "price": 40.0,
            }
        ],
    }
    request = httpx.Request("GET", "http://cart/cart-1/compare")
    product_request = httpx.Request("POST", "http://product/products/batch/offers")
    client = MagicMock(
        get=AsyncMock(
            side_effect=[
                response_with_json([cart]),
                httpx.ReadTimeout("slow", request=request),
                httpx.ReadTimeout("slow", request=request),
            ]
        ),
        post=AsyncMock(
            side_effect=[
                httpx.ReadTimeout("slow", request=product_request),
                httpx.ReadTimeout("slow", request=product_request),
            ]
        ),
    )

    prepared = await build_read_context(
        "Порівняй мій кошик",
        AgentDeps(http_client=client, user_id=USER_ID),
        request_id="request-2",
    )

    assert prepared.direct_response is not None
    assert any(block.type == "fallback" for block in prepared.direct_response.blocks)
    table = next(block for block in prepared.direct_response.blocks if block.type == "table")
    assert table.rows[0][0] == "Молоко"
    assert client.get.await_count == 2
    assert client.post.await_count == 2


async def test_cart_comparison_uses_product_service_when_cart_compare_fails():
    cart = {
        "id": "cart-1",
        "name": "Мій кошик",
        "items": [
            {
                "product_id": 42,
                "product_name": "Молоко",
                "quantity": 2,
                "price": 40.0,
            }
        ],
    }
    products = [
        {
            "id": 42,
            "offers": [
                {
                    "price": 39.0,
                    "in_stock": True,
                    "store": {
                        "external_id": "novus-1",
                        "name": "Novus",
                        "retail_chain": "novus",
                    },
                },
                {
                    "price": 41.0,
                    "in_stock": True,
                    "store": {
                        "external_id": "metro-1",
                        "name": "Metro",
                        "retail_chain": "metro",
                    },
                },
            ],
        }
    ]
    request = httpx.Request("GET", "http://cart/cart-1/compare")
    client = MagicMock(
        get=AsyncMock(
            side_effect=[
                response_with_json([cart]),
                httpx.ReadTimeout("slow", request=request),
                httpx.ReadTimeout("slow", request=request),
            ]
        ),
        post=AsyncMock(return_value=response_with_json(products)),
    )

    prepared = await build_read_context(
        "Порівняй мій кошик",
        AgentDeps(http_client=client, user_id=USER_ID),
        request_id="request-product-fallback",
    )

    assert prepared.direct_response is not None
    assert not any(block.type == "fallback" for block in prepared.direct_response.blocks)
    table = next(block for block in prepared.direct_response.blocks if block.type == "table")
    assert table.rows[0][0] == "Novus"
    assert table.rows[0][1] == "78.00 ₴"
    assert client.post.await_count == 1


async def test_catalog_context_keeps_useful_fallback_without_providers():
    client = MagicMock(
        get=AsyncMock(
            return_value=response_with_json(
                {
                    "hits": [
                        {
                            "id": 42,
                            "title": "Молоко",
                            "offers": [
                                {
                                    "price": 39.5,
                                    "in_stock": True,
                                    "store": {
                                        "external_id": "novus-1",
                                        "name": "Novus",
                                    },
                                }
                            ],
                        }
                    ],
                    "total_hits": 1,
                }
            )
        )
    )

    prepared = await build_read_context(
        "Порівняти ціни на молоко",
        AgentDeps(http_client=client, user_id=USER_ID),
        request_id="catalog-fallback",
    )

    assert prepared.degraded_response is not None
    assert any(block.type == "fallback" for block in prepared.degraded_response.blocks)
    table = next(block for block in prepared.degraded_response.blocks if block.type == "table")
    assert table.rows[0] == ["Молоко", "Novus", "39.50 ₴", True]
    assert prepared.allowed_product_ids == frozenset({42})


async def test_deals_prompt_uses_discount_search_instead_of_literal_phrase():
    client = MagicMock(get=AsyncMock(return_value=response_with_json({"hits": []})))

    await build_read_context(
        "Показати вигідні пропозиції",
        AgentDeps(http_client=client, user_id=USER_ID),
        request_id="deals",
    )

    params = client.get.await_args.kwargs["params"]
    assert params["q"] == ""
    assert params["offer_type"] == "promo"
    assert params["sort"] == "discount_percent:desc"


@pytest.mark.parametrize(
    ("message", "expected_query", "expected_min", "expected_max"),
    [
        ("дешевий до 50 грн сир", "сир", None, 50.0),
        ("сыр от 80 до 150 грн", "сыр", 80.0, 150.0),
    ],
)
async def test_free_form_catalog_query_applies_price_filters(
    message,
    expected_query,
    expected_min,
    expected_max,
):
    client = MagicMock(get=AsyncMock(return_value=response_with_json({"hits": []})))

    await build_read_context(
        message,
        AgentDeps(http_client=client, user_id=USER_ID),
        request_id="free-form-price",
    )

    params = client.get.await_args.kwargs["params"]
    assert params["q"] == expected_query
    assert params.get("price_min") == expected_min
    assert params.get("price_max") == expected_max
    if "дешевий" in message:
        assert params["sort"] == "price:asc"


async def test_best_value_query_sorts_by_lowest_price():
    client = MagicMock(get=AsyncMock(return_value=response_with_json({"hits": []})))

    await build_read_context(
        "найвигідніший кетчуп",
        AgentDeps(http_client=client, user_id=USER_ID),
        request_id="best-value",
    )

    params = client.get.await_args.kwargs["params"]
    assert params["q"] == "кетчуп"
    assert params["sort"] == "price:asc"


async def test_catalog_products_always_include_add_to_cart_buttons():
    client = MagicMock(
        get=AsyncMock(
            return_value=response_with_json(
                {
                    "hits": [
                        {
                            "id": 42,
                            "title": "Молоко 2,5%",
                            "image_url": "https://cdn.example/milk.webp",
                            "offers": [
                                {
                                    "price": 39.5,
                                    "in_stock": True,
                                    "store": {"external_id": "novus-1", "name": "Novus"},
                                }
                            ],
                        }
                    ]
                }
            )
        )
    )

    prepared = await build_read_context(
        "Порівняти ціни на молоко",
        AgentDeps(http_client=client, user_id=USER_ID),
        request_id="catalog-actions",
    )

    assert prepared.direct_response is not None
    assert [block.type for block in prepared.direct_response.blocks] == [
        "text",
        "product_card",
        "action_button",
    ]
    action = prepared.direct_response.blocks[-1]
    card = prepared.direct_response.blocks[1]
    assert card.image_url == "https://cdn.example/milk.webp"
    assert action.action == "add_to_cart"
    assert action.payload["product_id"] == 42


async def test_add_this_resolves_and_revalidates_product_from_structured_history():
    client = MagicMock(
        get=AsyncMock(
            return_value=response_with_json(
                {
                    "hits": [
                        {
                            "id": 42,
                            "title": "Морозиво Три Ведмеді",
                            "offers": [
                                {
                                    "price": 52.8,
                                    "in_stock": True,
                                    "store": {"external_id": "novus-1", "name": "Novus"},
                                }
                            ],
                        }
                    ]
                }
            )
        )
    )
    history = [
        {
            "role": "assistant",
            "content": {
                "blocks": [
                    {
                        "type": "product_card",
                        "product_id": 42,
                        "name": "Морозиво Три Ведмеді",
                        "store": "Novus",
                        "price": "52.80 ₴",
                        "in_stock": True,
                    }
                ]
            },
        }
    ]

    prepared = await build_read_context(
        "Додай це морозиво до кошика",
        AgentDeps(http_client=client, user_id=USER_ID),
        request_id="follow-up-add",
        history=history,
    )

    assert prepared.intent == "cart_add"
    assert prepared.direct_response is not None
    action = prepared.direct_response.blocks[-1]
    assert action.action == "add_to_cart"
    assert action.payload["product_id"] == 42
    assert client.get.await_count == 1


async def test_show_all_stores_reuses_previous_product_query():
    client = MagicMock(get=AsyncMock(return_value=response_with_json({"hits": []})))

    await build_read_context(
        "Показати всі магазини",
        AgentDeps(http_client=client, user_id=USER_ID),
        request_id="follow-up-broaden",
        history=[{"role": "user", "content": "Знайти найдешевший хліб"}],
    )

    assert client.get.await_args.kwargs["params"]["q"] == "хліб"


def test_action_product_must_exist_in_prepared_context():
    response = ZephyrosResponse.model_validate(
        {
            "blocks": [
                {
                    "type": "action_button",
                    "label": "Додати",
                    "action": "add_to_cart",
                    "payload": {"product_id": 999, "quantity": 1},
                }
            ]
        }
    )

    with pytest.raises(InvalidResponseError):
        valid_response(response, allowed_product_ids=frozenset({42}))


class CoordinationRedis:
    def __init__(self):
        self.values: dict[str, str] = {}
        self.hashes: dict[str, dict[str, float]] = {}

    async def get(self, key):
        return self.values.get(key)

    async def getdel(self, key):
        return self.values.pop(key, None)

    async def set(self, key, value, ex=None, nx=False):
        if nx and key in self.values:
            return False
        self.values[key] = value
        return True

    async def delete(self, *keys):
        for key in keys:
            self.values.pop(key, None)

    async def eval(self, _script, _count, key, token):
        if self.values.get(key) == token:
            self.values.pop(key, None)
            return 1
        return 0

    async def incr(self, key):
        value = int(self.values.get(key, "0")) + 1
        self.values[key] = str(value)
        return value


async def test_distributed_singleflight_returns_leader_result():
    redis = CoordinationRedis()
    leader_store = ResponseStore(redis)
    follower_store = ResponseStore(redis)
    key = "same-request"

    assert await leader_store.acquire_distributed(key) is None
    follower = asyncio.create_task(follower_store.acquire_distributed(key))
    await asyncio.sleep(0.02)

    future = asyncio.get_running_loop().create_future()
    value = ZephyrosResponse(blocks=[{"type": "text", "content": "ready"}])
    await leader_store.finish(key, future, value)
    joined = await asyncio.wait_for(follower, timeout=1)

    assert joined is not None
    assert joined.blocks[0].content == "ready"


async def test_cache_namespace_version_changes_after_invalidation():
    redis = CoordinationRedis()
    store = ResponseStore(redis)
    before = await store.versioned_key("base", user_scope=str(USER_ID))

    await store.invalidate("catalog")
    after = await store.versioned_key("base", user_scope=str(USER_ID))

    assert before != after


def review_token() -> str:
    return json.dumps(
        {
            "user_id": str(USER_ID),
            "action": "create_review",
            "payload": {"product_id": 42, "rating": 5, "text": "Добре"},
        }
    )


def test_confirmed_review_action_is_single_use(monkeypatch):
    redis = CoordinationRedis()
    token = "review-once"
    redis.values[f"zephyros:action:{token}"] = review_token()
    created = response_with_json({"id": "review-1"})
    http_client = MagicMock(post=AsyncMock(return_value=created))
    monkeypatch.setattr(app.state, "redis", redis, raising=False)
    monkeypatch.setattr(app.state, "http_client", http_client, raising=False)
    monkeypatch.setattr(app.state, "response_store", ResponseStore(redis), raising=False)
    client = TestClient(app)

    response = client.post(
        "/agent/actions/execute",
        json={"action_token": token},
        headers={"X-User-Id": str(USER_ID)},
    )
    replay = client.post(
        "/agent/actions/execute",
        json={"action_token": token},
        headers={"X-User-Id": str(USER_ID)},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Відгук опубліковано."
    assert replay.status_code == 409
    assert http_client.post.await_count == 1


def test_confirmed_clear_cart_action_uses_protected_cart_endpoint(monkeypatch):
    redis = CoordinationRedis()
    token = "clear-cart-once"
    cart_id = "4aa14fa7-e52e-43d1-b540-058030eae43d"
    redis.values[f"zephyros:action:{token}"] = json.dumps(
        {
            "user_id": str(USER_ID),
            "action": "clear_cart",
            "payload": {"cart_id": cart_id},
        }
    )
    deleted = response_with_json({"message": "ok"})
    http_client = MagicMock(delete=AsyncMock(return_value=deleted))
    monkeypatch.setattr(app.state, "redis", redis, raising=False)
    monkeypatch.setattr(app.state, "http_client", http_client, raising=False)
    monkeypatch.setattr(app.state, "response_store", ResponseStore(redis), raising=False)
    client = TestClient(app)

    response = client.post(
        "/agent/actions/execute",
        json={"action_token": token},
        headers={"X-User-Id": str(USER_ID)},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Кошик очищено."
    assert http_client.delete.await_args.args[0].endswith(f"/cart/{cart_id}")


def test_operator_diagnostics_are_protected_and_do_not_expose_models(monkeypatch):
    monkeypatch.setattr(settings, "ZEPHYROS_OPERATOR_KEY", "operator-secret")
    monkeypatch.setattr(app.state, "redis", None, raising=False)
    monkeypatch.setattr(app.state, "provider_state", ProviderState(None), raising=False)
    monkeypatch.setattr(app.state, "routing_metrics", RoutingMetrics(None), raising=False)
    client = TestClient(app)

    forbidden = client.get("/internal/diagnostics")
    allowed = client.get(
        "/internal/diagnostics",
        headers={"X-Zephyros-Operator-Key": "operator-secret"},
    )

    assert forbidden.status_code == 403
    assert allowed.status_code == 200
    payload = allowed.json()
    assert payload["slo"]["success_rate"] == settings.CHAT_SUCCESS_RATE_SLO
    assert "model" not in json.dumps(payload).casefold()


def test_slo_observation_reports_success_and_latency_compliance():
    observed = _slo_observation(
        {
            "chat_requests_total": 100,
            "chat_responses_total|outcome=success": 80,
            "chat_responses_total|outcome=direct": 20,
            "chat_request_latency_count|route=provider-race": 100,
            "chat_request_latency_bucket|le=5000,route=provider-race": 90,
            "chat_request_latency_bucket|le=8000,route=provider-race": 96,
            "chat_request_latency_bucket|le=12000,route=provider-race": 100,
        }
    )

    assert observed["sample_size"] == 100
    assert observed["success_rate"] == 1
    assert observed["success_rate_met"] is True
    assert observed["latency_p95_ms"] == 8000
    assert observed["latency_p95_met"] is True
