import httpx
from app.config import settings


async def fetch_product_details(product_id: int) -> dict:

    url = f"{settings.PRODUCT_SERVICE_URL}/api/v1/products/{product_id}"

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url)

            if response.status_code == 200:
                return response.json()
            return {}

    except httpx.RequestError as e:
        print(f"Помилка зв'язку з Product Service: {e}")
        return {}


async def fetch_product_offers(product_id: int) -> dict:
    url = f"{settings.PRODUCT_SERVICE_URL}/api/v1/products/{product_id}/offers"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                return response.json()
            return {}
    except httpx.RequestError as e:
        print(f"Помилка зв'язку з Product Service (offers): {e}")
        return {}


async def fetch_products_batch_details(client: httpx.AsyncClient, product_ids: list[int]) -> list[dict]:
    if not product_ids:
        return []
    url = f"{settings.PRODUCT_SERVICE_URL}/api/v1/products/batch/details"
    try:
        response = await client.post(url, json={"product_ids": product_ids})
        if response.status_code == 200:
            return response.json()
        return []
    except httpx.RequestError as e:
        print(f"Помилка зв'язку з Product Service (batch details): {e}")
        return []


async def fetch_products_batch_offers(client: httpx.AsyncClient, product_ids: list[int]) -> list[dict]:
    if not product_ids:
        return []
    url = f"{settings.PRODUCT_SERVICE_URL}/api/v1/products/batch/offers"
    try:
        response = await client.post(url, json={"product_ids": product_ids})
        if response.status_code == 200:
            return response.json()
        return []
    except httpx.RequestError as e:
        print(f"Помилка зв'язку з Product Service (batch offers): {e}")
        return []
