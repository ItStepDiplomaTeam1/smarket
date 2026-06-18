from fastapi.testclient import TestClient

from services.api.main import app

client = TestClient(app, headers={"X-User-Id": "123e4567-e89b-12d3-a456-426614174000", "X-User-Role": "admin"})


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_product_missing_body() -> None:
    response = client.post("/products", json={})
    assert response.status_code == 422


def test_create_product_invalid_category_uuid() -> None:
    response = client.post(
        "/products",
        json={
            "name": "Test",
            "category_id": "not-a-uuid",
            "external_id": "ext-1",
            "general_description": "desc",
            "specifications": {},
        },
    )
    assert response.status_code == 422


def test_delete_product_invalid_uuid() -> None:
    response = client.delete("/products/not-a-uuid")
    assert response.status_code == 422
