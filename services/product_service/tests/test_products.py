import pytest
import datetime
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient

from app.main import create_app
from app.database.session import get_db
from app.database.models import Product, Category, Price, Store

app = create_app()
client = TestClient(app)

@pytest.fixture
def mock_db():
    db = AsyncMock()
    app.dependency_overrides[get_db] = lambda: db
    yield db
    app.dependency_overrides.clear()

@pytest.fixture
def mock_product():
    cat = Category(
        id=1,
        slug="molochni-produkty",
        name="Молочні продукти",
        created_at=datetime.datetime.utcnow(),
        is_hidden=False
    )
    prod = Product(
        id=1,
        ean="4820000000017",
        store_product_id="12345",
        title="Молоко",
        brand="Яготинське",
        unit="g",
        weight=900.0,
        image_url="http://example.com/milk.jpg",
        canonical_category_id=1,
        category=cat,
        created_at=datetime.datetime.utcnow(),
        is_hidden=False
    )
    return prod

@pytest.fixture
def mock_price():
    store = Store(
        external_id="store_silpo",
        name="Сільпо",
        retail_chain="silpo",
        city="kiev",
        is_active=True,
        synced_at=datetime.datetime.utcnow()
    )
    price_row = Price(
        id=1,
        product_id=1,
        store_id="store_silpo",
        price=45.50,
        old_price=55.00,
        in_stock=True,
        recorded_at=datetime.datetime.utcnow(),
        store=store
    )
    return price_row

@pytest.mark.asyncio
async def test_get_products_happy_path(mock_db, mock_product, mock_price):
    mock_db.scalar.return_value = 1
    
    mock_result_products = MagicMock()
    mock_result_products.all.return_value = [(mock_product, 45.50, True)]
    
    mock_result_prices = MagicMock()
    mock_result_prices.scalars().all.return_value = [mock_price]
    
    mock_db.execute.side_effect = [mock_result_products, mock_result_prices]
    
    response = client.get("/api/v1/products?page=1&page_size=20")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["id"] == 1
    assert data["items"][0]["title"] == "Молоко"
    assert len(data["items"][0]["offers"]) == 1
    assert data["items"][0]["offers"][0]["price"] == 45.50

@pytest.mark.asyncio
async def test_get_products_store_filter(mock_db, mock_product, mock_price):
    mock_db.scalar.return_value = 1
    
    mock_result_products = MagicMock()
    mock_result_products.all.return_value = [(mock_product, 45.50, True)]
    
    mock_result_prices = MagicMock()
    mock_result_prices.scalars().all.return_value = [mock_price]
    
    mock_db.execute.side_effect = [mock_result_products, mock_result_prices]
    
    response = client.get("/api/v1/products?stores=silpo,novus")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1

@pytest.mark.asyncio
async def test_get_products_category_and_max_price(mock_db, mock_product, mock_price):
    mock_db.scalar.return_value = 1
    
    mock_result_products = MagicMock()
    mock_result_products.all.return_value = [(mock_product, 45.50, True)]
    
    mock_result_prices = MagicMock()
    mock_result_prices.scalars().all.return_value = [mock_price]
    
    mock_db.execute.side_effect = [mock_result_products, mock_result_prices]
    
    response = client.get("/api/v1/products?category=1&max_price=50")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1

@pytest.mark.asyncio
async def test_get_products_sort(mock_db, mock_product, mock_price):
    mock_db.scalar.return_value = 1
    
    mock_result_products = MagicMock()
    mock_result_products.all.return_value = [(mock_product, 45.50, True)]
    
    mock_result_prices = MagicMock()
    mock_result_prices.scalars().all.return_value = [mock_price]
    
    mock_db.execute.side_effect = [mock_result_products, mock_result_prices]
    
    response = client.get("/api/v1/products?sort=price_asc")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_popular_products_limits_price_history_to_selected_page(
    mock_db, mock_product, mock_price
):
    mock_db.scalar.return_value = 1

    mock_result_products = MagicMock()
    mock_result_products.scalars().all.return_value = [mock_product]

    mock_result_prices = MagicMock()
    mock_result_prices.scalars().all.return_value = [mock_price]

    mock_db.execute.side_effect = [mock_result_products, mock_result_prices]

    response = client.get(
        "/api/v1/products?category=1&limit=5&sort_by=popular"
    )

    assert response.status_code == 200
    assert response.json()["items"][0]["offers"][0]["price"] == 45.50
    latest_prices_sql = str(mock_db.execute.await_args_list[1].args[0])
    assert "prices.product_id IN" in latest_prices_sql


@pytest.mark.asyncio
async def test_get_products_page_beyond_result_set(mock_db):
    mock_db.scalar.return_value = 5 # 5 total matching products
    
    # For page=9999, the query won't find any products in database
    mock_result_products = MagicMock()
    mock_result_products.all.return_value = []
    
    mock_db.execute.return_value = mock_result_products
    
    response = client.get("/api/v1/products?page=9999")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 5
    assert len(data["items"]) == 0

@pytest.mark.asyncio
async def test_get_product_by_id_known(mock_db, mock_product, mock_price):
    mock_db.scalar.return_value = mock_product
    
    mock_result_prices = MagicMock()
    mock_result_prices.scalars().all.return_value = [mock_price]
    mock_db.execute.return_value = mock_result_prices
    
    response = client.get("/api/v1/products/1")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 1
    assert data["title"] == "Молоко"
    assert len(data["prices"]) == 1
    assert data["prices"][0]["price"] == 45.50

@pytest.mark.asyncio
async def test_get_product_by_id_unknown(mock_db):
    # Scalar returns None when product is not found
    mock_db.scalar.return_value = None
    
    response = client.get("/api/v1/products/9999")
    assert response.status_code == 404
    # Ensure raw exceptions don't leak
    assert "detail" in response.json()


@pytest.mark.asyncio
async def test_get_stores_cities(mock_db):
    mock_row_1 = MagicMock()
    mock_row_1.city = "Київ"
    mock_row_1.count = 15

    mock_row_2 = MagicMock()
    mock_row_2.city = "Львів"
    mock_row_2.count = 8

    mock_result = MagicMock()
    mock_result.all.return_value = [mock_row_1, mock_row_2]
    mock_db.execute.return_value = mock_result

    response = client.get("/api/v1/stores/cities")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["city"] == "Київ"
    assert data[0]["count"] == 15
    assert data[1]["city"] == "Львів"
    assert data[1]["count"] == 8


@pytest.mark.asyncio
async def test_get_products_city_filter(mock_db, mock_product, mock_price):
    mock_db.scalar.return_value = 1

    mock_result_products = MagicMock()
    mock_result_products.all.return_value = [(mock_product, 45.50, True)]

    mock_result_prices = MagicMock()
    mock_result_prices.scalars().all.return_value = [mock_price]

    mock_db.execute.side_effect = [mock_result_products, mock_result_prices]

    response = client.get("/api/v1/products?city=Київ")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1

