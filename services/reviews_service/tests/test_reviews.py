import pytest
import uuid
import datetime
from unittest.mock import AsyncMock, MagicMock, ANY
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import get_db
from app.proxy_auth import get_current_user
from app.database.models import Review
from app import crud

client = TestClient(app)

@pytest.fixture
def mock_db():
    db = AsyncMock()
    app.dependency_overrides[get_db] = lambda: db
    yield db
    app.dependency_overrides.clear()

@pytest.fixture
def mock_auth():
    async def mock_get_current_user():
        return "e2e0ac63-8f29-471c-9065-660bc277d790", "Test User"
    app.dependency_overrides[get_current_user] = mock_get_current_user
    yield
    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]

@pytest.fixture
def mock_review():
    return Review(
        id=uuid.UUID("d3b07384-d113-4ec2-a52d-947cd7281f9b"),
        product_id=42,
        user_id=uuid.UUID("e2e0ac63-8f29-471c-9065-660bc277d790"),
        user_name="Test User",
        rating=5,
        text="Excellent product!",
        created_at=datetime.datetime.now(datetime.UTC)
    )

@pytest.mark.asyncio
async def test_get_product_reviews(mock_db, mock_review, monkeypatch):
    mock_get = AsyncMock(return_value=[mock_review])
    monkeypatch.setattr(crud, "get_reviews_by_product", mock_get)

    response = client.get("/api/v1/reviews/product/42")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["rating"] == 5
    assert data[0]["text"] == "Excellent product!"
    mock_get.assert_awaited_once_with(mock_db, 42)

@pytest.mark.asyncio
async def test_add_review_success(mock_db, mock_auth, mock_review, monkeypatch):
    mock_create = AsyncMock(return_value=mock_review)
    monkeypatch.setattr(crud, "create_review", mock_create)

    payload = {"product_id": 42, "rating": 5, "text": "Excellent product!"}
    response = client.post("/api/v1/reviews/", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["text"] == "Excellent product!"
    mock_create.assert_awaited_once_with(
        mock_db,
        ANY,
        uuid.UUID("e2e0ac63-8f29-471c-9065-660bc277d790"),
        "Test User"
    )

@pytest.mark.asyncio
async def test_add_review_invalid_rating(mock_db, mock_auth):
    # Rating > 5
    payload = {"product_id": 42, "rating": 6, "text": "Too good!"}
    response = client.post("/api/v1/reviews/", json=payload)
    assert response.status_code == 422

    # Rating < 1
    payload = {"product_id": 42, "rating": 0, "text": "Horrible!"}
    response = client.post("/api/v1/reviews/", json=payload)
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_edit_review_by_owner(mock_db, mock_auth, mock_review, monkeypatch):
    mock_update = AsyncMock(return_value=mock_review)
    monkeypatch.setattr(crud, "update_review", mock_update)

    payload = {"rating": 4, "text": "Updated text"}
    review_id = "d3b07384-d113-4ec2-a52d-947cd7281f9b"
    
    response = client.put(f"/api/v1/reviews/{review_id}", json=payload)
    assert response.status_code == 200
    mock_update.assert_awaited_once_with(
        db=mock_db,
        review_id=uuid.UUID(review_id),
        user_id=uuid.UUID("e2e0ac63-8f29-471c-9065-660bc277d790"),
        rating=4,
        text="Updated text"
    )

@pytest.mark.asyncio
async def test_edit_review_by_non_owner(mock_db, mock_auth, monkeypatch):
    mock_update = AsyncMock(return_value=None)
    monkeypatch.setattr(crud, "update_review", mock_update)

    payload = {"rating": 4, "text": "Updated text"}
    review_id = str(uuid.uuid4())
    
    response = client.put(f"/api/v1/reviews/{review_id}", json=payload)
    assert response.status_code == 404
    assert "у вас немає прав" in response.json()["detail"]

@pytest.mark.asyncio
async def test_delete_review_by_owner(mock_db, mock_auth, monkeypatch):
    mock_delete = AsyncMock(return_value=True)
    monkeypatch.setattr(crud, "delete_review", mock_delete)

    review_id = "d3b07384-d113-4ec2-a52d-947cd7281f9b"
    response = client.delete(f"/api/v1/reviews/{review_id}")
    
    assert response.status_code == 200
    assert "успішно видалено" in response.json()["message"]
    mock_delete.assert_awaited_once_with(
        mock_db,
        uuid.UUID(review_id),
        uuid.UUID("e2e0ac63-8f29-471c-9065-660bc277d790")
    )

@pytest.mark.asyncio
async def test_delete_review_by_non_owner(mock_db, mock_auth, monkeypatch):
    mock_delete = AsyncMock(return_value=False)
    monkeypatch.setattr(crud, "delete_review", mock_delete)

    review_id = str(uuid.uuid4())
    response = client.delete(f"/api/v1/reviews/{review_id}")
    
    assert response.status_code == 404
    assert "у вас немає прав" in response.json()["detail"]
