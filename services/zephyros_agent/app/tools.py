from pydantic_ai import RunContext

from app.deps import AgentDeps
from app.config import settings


async def search_catalog(
    ctx: RunContext[AgentDeps],
    query: str,
    store_id: str | None = None,
    price_min: float | None = None,
    price_max: float | None = None,
    in_stock: bool = True,
) -> dict:
    params: dict = {"q": query, "in_stock": str(in_stock).lower()}
    if store_id:
        params["store_id"] = store_id
    if price_min is not None:
        params["price_min"] = price_min
    if price_max is not None:
        params["price_max"] = price_max

    response = await ctx.deps.http_client.get(
        f"{settings.SEARCH_SERVICE_URL}/search",
        params=params,
        timeout=5.0,
    )
    response.raise_for_status()
    return response.json()


async def compare_product_offers(
    ctx: RunContext[AgentDeps],
    product_id: int,
) -> dict:
    response = await ctx.deps.http_client.get(
        f"{settings.PRODUCT_SERVICE_URL}/products/{product_id}",
        timeout=5.0,
    )
    response.raise_for_status()
    return response.json()


async def get_user_cart(ctx: RunContext[AgentDeps]) -> dict:
    if not ctx.deps.user_id:
        return {"error": "User is not authenticated. Cannot access cart."}

    headers = {"X-User-Id": str(ctx.deps.user_id)}
    response = await ctx.deps.http_client.get(
        f"{settings.CART_SERVICE_URL}/",
        headers=headers,
        timeout=5.0,
    )
    response.raise_for_status()
    return response.json()


async def add_product_to_cart(
    ctx: RunContext[AgentDeps],
    product_id: int,
    quantity: int = 1,
) -> dict:
    if not ctx.deps.user_id:
        return {"error": "User is not authenticated. Cannot modify cart."}

    headers = {"X-User-Id": str(ctx.deps.user_id)}

    carts_response = await ctx.deps.http_client.get(
        f"{settings.CART_SERVICE_URL}/",
        headers=headers,
        timeout=5.0,
    )
    carts_response.raise_for_status()
    carts = carts_response.json()

    if not carts:
        create_response = await ctx.deps.http_client.post(
            f"{settings.CART_SERVICE_URL}/",
            json={"name": "Мій кошик"},
            headers=headers,
            timeout=5.0,
        )
        create_response.raise_for_status()
        cart_id = create_response.json()["id"]
    else:
        cart_id = carts[0]["id"]

    add_response = await ctx.deps.http_client.post(
        f"{settings.CART_SERVICE_URL}/{cart_id}/items",
        json={"product_id": product_id, "quantity": quantity},
        headers=headers,
        timeout=5.0,
    )
    add_response.raise_for_status()
    return {"status": "success", "message": f"Товар #{product_id} додано до кошика (кількість: {quantity})."}
