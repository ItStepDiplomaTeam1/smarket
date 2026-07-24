import pytest
import uuid
import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import get_db
from app.routers.cart import get_user_id, get_http_client
from app.database.models import Cart, CartItem, Receipt
import app.crud as crud

client = TestClient(app)

# Test IDs
USER_ID = uuid.UUID("e2e0ac63-8f29-471c-9065-660bc277d790")
CART_ID = uuid.UUID("349fd043-4712-4fb8-9c48-e8cb9a712f5a")
OTHER_CART_ID = uuid.UUID("8c291244-1244-4299-bbbb-f291048471b4")
PRODUCT_ID = 123


@pytest.fixture(autouse=True)
def setup_dependencies():
    # Override get_user_id to return our hardcoded USER_ID
    app.dependency_overrides[get_user_id] = lambda: USER_ID
    # Override get_db to return an AsyncMock that returns a mock execute result
    mock_db = AsyncMock()
    mock_execute_result = MagicMock()
    mock_execute_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_execute_result
    app.dependency_overrides[get_db] = lambda: mock_db
    # Override get_http_client to avoid starlette state error
    mock_client = AsyncMock()
    app.dependency_overrides[get_http_client] = lambda: mock_client

    yield mock_db
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def patch_receipt_init(monkeypatch):
    original_init = Receipt.__init__

    def patched_init(self, *args, **kwargs):
        original_init(self, *args, **kwargs)
        self.id = uuid.uuid4()
        self.created_at = datetime.datetime.utcnow()

    monkeypatch.setattr(Receipt, "__init__", patched_init)


@pytest.mark.asyncio
async def test_add_item_happy_path(monkeypatch):
    mock_item = CartItem(
        id=uuid.uuid4(), cart_id=CART_ID, product_id=PRODUCT_ID, quantity=2
    )
    mock_cart = Cart(
        id=CART_ID,
        user_id=USER_ID,
        name="Test Cart",
        updated_at=datetime.datetime.utcnow(),
        items=[mock_item],
    )

    # Mock crud.add_item
    mock_add = AsyncMock(return_value=mock_cart)
    monkeypatch.setattr(crud, "add_item", mock_add)

    # Mock get_cart for response serialization
    mock_get = AsyncMock(return_value=mock_cart)
    monkeypatch.setattr(crud, "get_cart", mock_get)

    # Mock external API details call
    mock_details = AsyncMock(
        return_value=[
            {
                "id": PRODUCT_ID,
                "title": "Test Product",
                "image_url": "http://example.com/image.jpg",
                "prices": [{"price": 10.5, "in_stock": True}],
            }
        ]
    )
    monkeypatch.setattr("app.routers.cart.fetch_products_batch_details", mock_details)

    response = client.post(
        f"/cart/{CART_ID}/items", json={"product_id": PRODUCT_ID, "quantity": 2}
    )

    assert response.status_code in (200, 201)
    data = response.json()
    assert data["id"] == str(CART_ID)
    assert len(data["items"]) == 1
    assert data["items"][0]["product_id"] == PRODUCT_ID
    assert data["items"][0]["quantity"] == 2
    assert data["total_price"] == 21.0


@pytest.mark.asyncio
async def test_add_item_non_owned_cart(monkeypatch):
    # crud.add_item returns None if cart not found or not owned
    mock_add = AsyncMock(return_value=None)
    monkeypatch.setattr(crud, "add_item", mock_add)

    response = client.post(
        f"/cart/{OTHER_CART_ID}/items", json={"product_id": PRODUCT_ID, "quantity": 2}
    )
    assert response.status_code in (403, 404)


def test_add_item_invalid_payload():
    # quantity <= 0
    response = client.post(
        f"/cart/{CART_ID}/items", json={"product_id": PRODUCT_ID, "quantity": 0}
    )
    assert response.status_code == 422

    # missing product_id
    response = client.post(f"/cart/{CART_ID}/items", json={"quantity": 2})
    assert response.status_code == 422


def test_get_all_carts_ignores_malformed_product_prices(monkeypatch):
    item = CartItem(
        id=uuid.uuid4(),
        cart_id=CART_ID,
        product_id=PRODUCT_ID,
        quantity=2,
    )
    cart = Cart(
        id=CART_ID,
        user_id=USER_ID,
        name="Test Cart",
        updated_at=datetime.datetime.utcnow(),
        items=[item],
    )
    monkeypatch.setattr(
        crud,
        "get_user_carts",
        AsyncMock(return_value=[cart]),
    )
    monkeypatch.setattr(
        "app.routers.cart.fetch_products_batch_details",
        AsyncMock(
            return_value=[
                None,
                {
                    "id": PRODUCT_ID,
                    "title": "Milk",
                    "image_url": None,
                    "prices": [
                        None,
                        {"price": None, "in_stock": True},
                        {"price": "42.50", "in_stock": True},
                    ],
                },
            ]
        ),
    )

    response = client.get("/cart/")

    assert response.status_code == 200
    assert response.json()[0]["total_price"] == 85.0
    assert response.json()[0]["items"][0]["price"] == 42.5


@pytest.mark.asyncio
async def test_compare_cart_happy_path(monkeypatch):
    mock_item = CartItem(
        id=uuid.uuid4(), cart_id=CART_ID, product_id=PRODUCT_ID, quantity=2
    )
    mock_cart = Cart(
        id=CART_ID,
        user_id=USER_ID,
        name="Test Cart",
        updated_at=datetime.datetime.utcnow(),
        items=[mock_item],
    )
    monkeypatch.setattr(crud, "get_cart", AsyncMock(return_value=mock_cart))

    # Mock offers API response: Silpo (10.5, Kiev, in stock) vs Novus (12.0, Lviv, in stock)
    mock_offers = AsyncMock(
        return_value=[
            {
                "id": PRODUCT_ID,
                "offers": [
                    {
                        "store": {
                            "external_id": "store_silpo",
                            "name": "Silpo",
                            "retail_chain": "silpo",
                            "city": "kiev",
                            "address": "Khreshchatyk 1",
                            "lat": 50.45,
                            "lng": 30.52,
                        },
                        "price": 10.5,
                        "in_stock": True,
                    },
                    {
                        "store": {
                            "external_id": "store_silpo",
                            "name": "Silpo",
                            "retail_chain": "silpo",
                            "city": "kiev",
                            "address": "Khreshchatyk 1",
                            "lat": 50.45,
                            "lng": 30.52,
                        },
                        "price": 10.5,
                        "in_stock": True,
                    },
                    {
                        "store": {
                            "external_id": "store_novus",
                            "name": "Novus",
                            "retail_chain": "novus",
                            "city": "lviv",
                            "address": "Shevchenko 12",
                            "lat": 49.83,
                            "lng": 24.01,
                        },
                        "price": 12.0,
                        "in_stock": True,
                    },
                ],
            }
        ]
    )
    monkeypatch.setattr("app.routers.cart.fetch_products_batch_offers", mock_offers)

    response = client.get(f"/cart/{CART_ID}/compare")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    # Sorted by price ascending: Silpo (21.0) then Novus (24.0)
    assert data[0]["store_id"] == "store_silpo"
    assert data[0]["total_price"] == 21.0
    assert data[0]["is_complete"] is True
    assert data[0]["item_prices"] == [
        {
            "product_id": PRODUCT_ID,
            "unit_price": 10.5,
            "quantity": 2,
            "subtotal": 21.0,
        }
    ]
    assert data[1]["store_id"] == "store_novus"
    assert data[1]["total_price"] == 24.0
    assert data[1]["item_prices"][0]["unit_price"] == 12.0


@pytest.mark.asyncio
async def test_compare_cart_deduplicates_multiple_offers_for_same_store(monkeypatch):
    mock_item = CartItem(
        id=uuid.uuid4(), cart_id=CART_ID, product_id=PRODUCT_ID, quantity=1
    )
    mock_cart = Cart(
        id=CART_ID,
        user_id=USER_ID,
        name="Test Cart",
        updated_at=datetime.datetime.utcnow(),
        items=[mock_item],
    )
    monkeypatch.setattr(crud, "get_cart", AsyncMock(return_value=mock_cart))

    # Product return 2 duplicate offers for store_silpo
    mock_offers = AsyncMock(
        return_value=[
            {
                "id": PRODUCT_ID,
                "offers": [
                    {
                        "store": {
                            "external_id": "store_silpo",
                            "name": "Silpo",
                            "retail_chain": "silpo",
                            "city": "kiev",
                        },
                        "price": 100.0,
                        "in_stock": True,
                    },
                    {
                        "store": {
                            "external_id": "store_silpo",
                            "name": "Silpo",
                            "retail_chain": "silpo",
                            "city": "kiev",
                        },
                        "price": 100.0,
                        "in_stock": True,
                    },
                ],
            }
        ]
    )
    monkeypatch.setattr("app.routers.cart.fetch_products_batch_offers", mock_offers)

    response = client.get(f"/cart/{CART_ID}/compare")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    # Total price must be 100.0 (counted once), not 200.0
    assert data[0]["store_id"] == "store_silpo"
    assert data[0]["total_price"] == 100.0
    assert data[0]["found_items_count"] == 1
    assert data[0]["missing_items_count"] == 0


@pytest.mark.asyncio
async def test_compare_cart_city_filter(monkeypatch):
    mock_item = CartItem(
        id=uuid.uuid4(), cart_id=CART_ID, product_id=PRODUCT_ID, quantity=2
    )
    mock_cart = Cart(
        id=CART_ID,
        user_id=USER_ID,
        name="Test Cart",
        updated_at=datetime.datetime.utcnow(),
        items=[mock_item],
    )
    monkeypatch.setattr(crud, "get_cart", AsyncMock(return_value=mock_cart))

    mock_offers = AsyncMock(
        return_value=[
            {
                "id": PRODUCT_ID,
                "offers": [
                    {
                        "store": {
                            "external_id": "store_silpo",
                            "name": "Silpo",
                            "retail_chain": "silpo",
                            "city": "kiev",
                            "address": "Khreshchatyk 1",
                        },
                        "price": 10.5,
                        "in_stock": True,
                    },
                    {
                        "store": {
                            "external_id": "store_novus",
                            "name": "Novus",
                            "retail_chain": "novus",
                            "city": "lviv",
                            "address": "Shevchenko 12",
                        },
                        "price": 12.0,
                        "in_stock": True,
                    },
                ],
            }
        ]
    )
    monkeypatch.setattr("app.routers.cart.fetch_products_batch_offers", mock_offers)

    # City filter 'lviv' should only return Novus
    response = client.get(f"/cart/{CART_ID}/compare?city=lviv")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["store_id"] == "store_novus"


@pytest.mark.asyncio
async def test_compare_cart_city_fallback(monkeypatch):
    mock_item = CartItem(
        id=uuid.uuid4(), cart_id=CART_ID, product_id=PRODUCT_ID, quantity=2
    )
    mock_cart = Cart(
        id=CART_ID,
        user_id=USER_ID,
        name="Test Cart",
        updated_at=datetime.datetime.utcnow(),
        items=[mock_item],
    )
    monkeypatch.setattr(crud, "get_cart", AsyncMock(return_value=mock_cart))

    mock_offers = AsyncMock(
        return_value=[
            {
                "id": PRODUCT_ID,
                "offers": [
                    {
                        "store": {
                            "external_id": "store_silpo",
                            "name": "Silpo",
                            "retail_chain": "silpo",
                            "city": "kiev",
                            "address": "Khreshchatyk 1",
                        },
                        "price": 10.5,
                        "in_stock": True,
                    }
                ],
            }
        ]
    )
    monkeypatch.setattr("app.routers.cart.fetch_products_batch_offers", mock_offers)

    # Filtering by Odesa (no store) should fall back to Kiev store
    response = client.get(f"/cart/{CART_ID}/compare?city=odesa")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["store_id"] == "store_silpo"


@pytest.mark.asyncio
async def test_complete_cart_happy_path(monkeypatch):
    mock_item = CartItem(
        id=uuid.uuid4(), cart_id=CART_ID, product_id=PRODUCT_ID, quantity=2
    )
    mock_cart = Cart(
        id=CART_ID,
        user_id=USER_ID,
        name="Test Cart",
        updated_at=datetime.datetime.utcnow(),
        items=[mock_item],
    )
    monkeypatch.setattr(crud, "get_cart", AsyncMock(return_value=mock_cart))

    mock_offers = AsyncMock(
        return_value=[
            {
                "id": PRODUCT_ID,
                "offers": [
                    {
                        "store": {
                            "external_id": "store_silpo",
                            "name": "Silpo",
                            "retail_chain": "silpo",
                            "city": "kiev",
                            "address": "Khreshchatyk 1",
                        },
                        "price": 10.5,
                        "in_stock": True,
                    }
                ],
            }
        ]
    )
    monkeypatch.setattr("app.routers.cart.fetch_products_batch_offers", mock_offers)

    # We patch the background task function to assert it was triggered
    with patch("app.routers.cart._generate_ai_description") as mock_bg_task:
        response = client.post(f"/cart/{CART_ID}/complete")
        assert response.status_code in (200, 201)
        data = response.json()
        assert "share_token" in data
        assert data["total_price"] == 21.0
        # Check background task was added
        mock_bg_task.assert_called_once()


@pytest.mark.asyncio
async def test_complete_cart_uses_selected_store(monkeypatch):
    mock_item = CartItem(
        id=uuid.uuid4(), cart_id=CART_ID, product_id=PRODUCT_ID, quantity=2
    )
    mock_cart = Cart(
        id=CART_ID,
        user_id=USER_ID,
        name="Selected Store Cart",
        updated_at=datetime.datetime.utcnow(),
        items=[mock_item],
    )
    monkeypatch.setattr(crud, "get_cart", AsyncMock(return_value=mock_cart))
    monkeypatch.setattr(
        "app.routers.cart.fetch_products_batch_offers",
        AsyncMock(
            return_value=[
                {
                    "id": PRODUCT_ID,
                    "title": "Milk",
                    "offers": [
                        {
                            "store": {
                                "external_id": "store_silpo",
                                "name": "Silpo",
                                "retail_chain": "silpo",
                                "city": "kiev",
                                "address": "Khreshchatyk 1",
                            },
                            "price": 10.5,
                            "in_stock": True,
                        },
                        {
                            "store": {
                                "external_id": "store_novus",
                                "name": "Novus",
                                "retail_chain": "novus",
                                "city": "kiev",
                                "address": "Peremohy 10",
                            },
                            "price": 12.0,
                            "in_stock": True,
                        },
                    ],
                }
            ]
        ),
    )

    with patch("app.routers.cart._generate_ai_description") as mock_bg_task:
        response = client.post(
            f"/cart/{CART_ID}/complete",
            params={"store_id": "store_novus"},
        )

    assert response.status_code in (200, 201)
    data = response.json()
    assert data["total_price"] == 24.0
    assert data["savings_amount"] == 0.0
    assert data["snapshot"][0]["store_id"] == "store_novus"
    assert data["snapshot"][0]["store_name"] == "Novus"
    mock_bg_task.assert_called_once()


@pytest.mark.asyncio
async def test_complete_empty_cart(monkeypatch):
    mock_cart = Cart(
        id=CART_ID,
        user_id=USER_ID,
        name="Test Cart",
        updated_at=datetime.datetime.utcnow(),
        items=[],
    )
    monkeypatch.setattr(crud, "get_cart", AsyncMock(return_value=mock_cart))

    response = client.post(f"/cart/{CART_ID}/complete")
    assert response.status_code in (400, 422)


@pytest.mark.asyncio
async def test_complete_cart_rejects_partial_store_without_deleting_cart(
    monkeypatch,
    setup_dependencies,
):
    mock_item = CartItem(
        id=uuid.uuid4(),
        cart_id=CART_ID,
        product_id=PRODUCT_ID,
        quantity=1,
    )
    missing_item = CartItem(
        id=uuid.uuid4(),
        cart_id=CART_ID,
        product_id=456,
        quantity=1,
    )
    mock_cart = Cart(
        id=CART_ID,
        user_id=USER_ID,
        name="Partial Cart",
        updated_at=datetime.datetime.utcnow(),
        items=[mock_item, missing_item],
    )
    monkeypatch.setattr(crud, "get_cart", AsyncMock(return_value=mock_cart))
    monkeypatch.setattr(
        "app.routers.cart.fetch_products_batch_offers",
        AsyncMock(
            return_value=[
                {
                    "id": PRODUCT_ID,
                    "offers": [
                        {
                            "store": {
                                "external_id": "store_silpo",
                                "name": "Silpo",
                                "retail_chain": "silpo",
                                "city": "kiev",
                            },
                            "price": 10.5,
                            "in_stock": True,
                        }
                    ],
                },
                {"id": 456, "offers": []},
            ]
        ),
    )

    response = client.post(f"/cart/{CART_ID}/complete")

    assert response.status_code == 422
    assert "всіх товарів" in response.json()["detail"]
    setup_dependencies.delete.assert_not_awaited()


@pytest.mark.asyncio
async def test_complete_cart_rejects_selected_partial_store(
    monkeypatch,
    setup_dependencies,
):
    first_item = CartItem(
        id=uuid.uuid4(),
        cart_id=CART_ID,
        product_id=PRODUCT_ID,
        quantity=1,
    )
    second_item = CartItem(
        id=uuid.uuid4(),
        cart_id=CART_ID,
        product_id=456,
        quantity=1,
    )
    mock_cart = Cart(
        id=CART_ID,
        user_id=USER_ID,
        name="Selected Partial Store Cart",
        updated_at=datetime.datetime.utcnow(),
        items=[first_item, second_item],
    )
    monkeypatch.setattr(crud, "get_cart", AsyncMock(return_value=mock_cart))
    monkeypatch.setattr(
        "app.routers.cart.fetch_products_batch_offers",
        AsyncMock(
            return_value=[
                {
                    "id": PRODUCT_ID,
                    "offers": [
                        {
                            "store": {
                                "external_id": "store_silpo",
                                "name": "Silpo",
                                "retail_chain": "silpo",
                                "city": "kiev",
                            },
                            "price": 10.5,
                            "in_stock": True,
                        },
                        {
                            "store": {
                                "external_id": "store_novus",
                                "name": "Novus",
                                "retail_chain": "novus",
                                "city": "kiev",
                            },
                            "price": 9.5,
                            "in_stock": True,
                        },
                    ],
                },
                {
                    "id": 456,
                    "offers": [
                        {
                            "store": {
                                "external_id": "store_silpo",
                                "name": "Silpo",
                                "retail_chain": "silpo",
                                "city": "kiev",
                            },
                            "price": 20.0,
                            "in_stock": True,
                        }
                    ],
                },
            ]
        ),
    )

    response = client.post(
        f"/cart/{CART_ID}/complete",
        params={"store_id": "store_novus"},
    )

    assert response.status_code == 422
    assert "Обраний магазин не має всіх товарів" in response.json()["detail"]
    setup_dependencies.delete.assert_not_awaited()


def test_shared_cart_route_is_not_shadowed_by_cart_id_route(setup_dependencies):
    setup_dependencies.execute.return_value.scalars.return_value.first.return_value = (
        None
    )
    response = client.get(f"/cart/shared/{CART_ID}")

    assert response.status_code == 404
    assert "посиланням" in response.json()["detail"]


def test_shared_cart_does_not_expose_owner_or_internal_cart_ids(
    monkeypatch, setup_dependencies
):
    item = CartItem(
        id=uuid.uuid4(),
        cart_id=CART_ID,
        product_id=PRODUCT_ID,
        quantity=2,
    )
    cart = Cart(
        id=CART_ID,
        user_id=USER_ID,
        name="Shared cart",
        updated_at=datetime.datetime.utcnow(),
        items=[item],
    )
    setup_dependencies.execute.return_value.scalars.return_value.first.return_value = cart
    monkeypatch.setattr(
        "app.routers.cart.fetch_products_batch_details",
        AsyncMock(
            return_value=[
                {
                    "id": PRODUCT_ID,
                    "title": "Milk",
                    "image_url": None,
                    "prices": [{"price": 42.5, "in_stock": True}],
                }
            ]
        ),
    )

    response = client.get(f"/cart/shared/{CART_ID}")

    assert response.status_code == 200
    payload = response.json()
    assert "user_id" not in payload
    assert "cart_id" not in payload["items"][0]
