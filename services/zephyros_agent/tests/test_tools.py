import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock
from pydantic_ai import RunContext

from app.deps import AgentDeps
from app.tools import search_and_compare_offers, add_product_to_cart

@pytest.fixture
def mock_ctx():
    ctx = MagicMock(spec=RunContext)
    http_client = AsyncMock()
    redis_client = AsyncMock()
    # Mock redis get to return None (no cache hit)
    redis_client.get.return_value = None
    
    ctx.deps = AgentDeps(
        http_client=http_client,
        user_id=uuid.UUID("e2e0ac63-8f29-471c-9065-660bc277d790"),
        redis_client=redis_client
    )
    return ctx

@pytest.mark.asyncio
async def test_search_and_compare_offers_happy_path(mock_ctx):
    # Mock search service response
    search_res = MagicMock()
    search_res.json.return_value = {
        "hits": [
            {"id": 101, "title": "Milk"},
            {"id": 102, "title": "Bread"}
        ]
    }
    
    # Mock product details responses
    prod_101_res = MagicMock()
    prod_101_res.json.return_value = {
        "id": 101,
        "prices": [
            {"store_id": "silpo", "price": 40.0, "old_price": None, "in_stock": True},
            {"store_id": "novus", "price": 35.0, "old_price": None, "in_stock": True}
        ]
    }
    
    prod_102_res = MagicMock()
    prod_102_res.json.return_value = {
        "id": 102,
        "prices": [
            {"store_id": "metro", "price": 25.0, "old_price": 30.0, "in_stock": True}
        ]
    }
    
    mock_ctx.deps.http_client.get.side_effect = [search_res, prod_101_res, prod_102_res]
    
    result = await search_and_compare_offers(mock_ctx, query="test")
    
    assert "hits" in result
    assert len(result["hits"]) == 2
    assert result["match_percentage"] == 90
    
    # Check that cheapest offer is highlighted
    # For Milk (101): novus has price 35.0 (cheapest), silpo has 40.0.
    detailed_101 = result["hits"][0]["detailed_offers"]
    assert detailed_101[0]["store_id"] == "silpo"
    assert detailed_101[0]["highlighted"] is False
    assert detailed_101[1]["store_id"] == "novus"
    assert detailed_101[1]["highlighted"] is True
    
    # For Bread (102): metro has price 25.0 (only one, so cheapest).
    detailed_102 = result["hits"][1]["detailed_offers"]
    assert detailed_102[0]["store_id"] == "metro"
    assert detailed_102[0]["highlighted"] is True

@pytest.mark.asyncio
async def test_search_and_compare_offers_no_results(mock_ctx):
    search_res = MagicMock()
    search_res.json.return_value = {"hits": []}
    mock_ctx.deps.http_client.get.return_value = search_res
    
    result = await search_and_compare_offers(mock_ctx, query="non-existent")
    
    assert result["hits"] == []
    assert result["match_percentage"] == 0
    assert "fallback" in result
    assert "Не знайдено" in result["fallback"]["message"]

@pytest.mark.asyncio
async def test_add_product_to_cart_requires_confirmation(mock_ctx):
    # Call with confirm=False (default behavior)
    result = await add_product_to_cart(mock_ctx, product_id=42, quantity=2, store_id="silpo")
    
    # Check that it returns an action button and does NOT query cart service
    assert "action_button" in result
    action_btn = result["action_button"]
    assert action_btn["action"] == "add_to_cart"
    assert action_btn["payload"] == {
        "product_id": 42,
        "quantity": 2,
        "store_id": "silpo"
    }
    assert mock_ctx.deps.http_client.get.call_count == 0
    assert mock_ctx.deps.http_client.post.call_count == 0

@pytest.mark.asyncio
async def test_add_product_to_cart_with_confirmation(mock_ctx):
    # Mock cart listing and adding item
    get_carts_res = MagicMock()
    get_carts_res.json.return_value = [{"id": "cart-123"}]
    
    add_item_res = MagicMock()
    add_item_res.json.return_value = {"status": "added"}
    
    mock_ctx.deps.http_client.get.return_value = get_carts_res
    mock_ctx.deps.http_client.post.return_value = add_item_res
    
    # Call with confirm=True
    result = await add_product_to_cart(mock_ctx, product_id=42, quantity=2, confirm=True)
    
    assert result["status"] == "success"
    assert "додано до кошика" in result["message"]
    # Check that HTTP calls were made
    assert mock_ctx.deps.http_client.get.call_count == 1
    assert mock_ctx.deps.http_client.post.call_count == 1
