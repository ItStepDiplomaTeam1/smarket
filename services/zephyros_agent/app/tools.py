import asyncio
import json
import httpx
from loguru import logger
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
    """Search the Smarket product catalog for items matching a text query, with optional filters.

    Args:
        query: The search term (e.g. 'молоко', 'хліб').
        store_id: Optional supermarket slug filter (e.g., 'atb', 'novus', 'metro', 'auchan').
        price_min: Optional minimum price filter in UAH.
        price_max: Optional maximum price filter in UAH.
        in_stock: Filter to only return items that are currently in stock (default True).
    """
    params: dict = {"q": query, "in_stock": str(in_stock).lower()}
    if store_id:
        if store_id.lower() in ("atb", "silpo", "novus", "metro", "auchan", "varus", "ultramarket"):
            params["retail_chain"] = store_id
        else:
            params["store_id"] = store_id
    if price_min is not None:
        params["price_min"] = price_min
    if price_max is not None:
        params["price_max"] = price_max

    tool_log = logger.bind(
        tool="search_catalog",
        query=query,
        store_id=store_id,
        price_min=price_min,
        price_max=price_max,
        in_stock=in_stock,
    )

    try:
        tool_log.info("Calling search_service")
        response = await ctx.deps.http_client.get(
            f"{settings.SEARCH_SERVICE_URL}/search",
            params=params,
            timeout=3.0,
        )
        response.raise_for_status()
        tool_log.bind(status_code=response.status_code).info("search_service response received")
        return response.json()
    except httpx.RequestError as e:
        tool_log.bind(error=str(e)).warning("search_service unavailable")
        return {"error": "search_service_unavailable", "detail": str(e)}
    except httpx.HTTPStatusError as e:
        tool_log.bind(status_code=e.response.status_code).warning("search_service returned error")
        return {"error": "search_service_error", "status_code": e.response.status_code}


async def compare_product_offers(
    ctx: RunContext[AgentDeps],
    product_id: int,
) -> dict:
    """Retrieve detailed product information, active prices, and offers across different stores for a product.

    Args:
        product_id: The unique integer ID of the product.
    """
    try:
        logger.bind(tool="compare_product_offers", product_id=product_id).info(
            "Calling product_service for offers"
        )
        response = await ctx.deps.http_client.get(
            f"{settings.PRODUCT_SERVICE_URL}/products/{product_id}",
            timeout=3.0,
        )
        response.raise_for_status()
        logger.bind(
            tool="compare_product_offers",
            product_id=product_id,
            status_code=response.status_code,
        ).info("product_service response received")
        return response.json()
    except httpx.RequestError as e:
        logger.bind(tool="compare_product_offers", product_id=product_id, error=str(e)).warning(
            "product_service unavailable"
        )
        return {"error": "product_service_unavailable", "detail": str(e)}
    except httpx.HTTPStatusError as e:
        logger.bind(
            tool="compare_product_offers",
            product_id=product_id,
            status_code=e.response.status_code,
        ).warning("product_service returned error")
        return {"error": "product_service_error", "status_code": e.response.status_code}


async def get_user_cart(ctx: RunContext[AgentDeps]) -> dict:
    """Retrieve all items currently in the authenticated user's shopping cart."""
    if not ctx.deps.user_id:
        logger.bind(tool="get_user_cart").warning("Missing user_id in agent context")
        return {"error": "User is not authenticated. Cannot access cart."}

    headers = {"X-User-Id": str(ctx.deps.user_id)}
    try:
        logger.bind(tool="get_user_cart", user_id=str(ctx.deps.user_id)).info(
            "Calling cart_service for user cart"
        )
        response = await ctx.deps.http_client.get(
            f"{settings.CART_SERVICE_URL}/",
            headers=headers,
            timeout=3.0,
        )
        response.raise_for_status()
        logger.bind(
            tool="get_user_cart",
            user_id=str(ctx.deps.user_id),
            status_code=response.status_code,
        ).info("cart_service response received")
        return response.json()
    except httpx.RequestError as e:
        logger.bind(tool="get_user_cart", user_id=str(ctx.deps.user_id), error=str(e)).warning(
            "cart_service unavailable"
        )
        return {"error": "cart_service_unavailable", "detail": str(e)}
    except httpx.HTTPStatusError as e:
        logger.bind(
            tool="get_user_cart",
            user_id=str(ctx.deps.user_id),
            status_code=e.response.status_code,
        ).warning("cart_service returned error")
        return {"error": "cart_service_error", "status_code": e.response.status_code}

async def add_product_to_cart(
    ctx: RunContext[AgentDeps],
    product_id: int,
    quantity: int = 1,
    store_id: str | None = None,
    confirm: bool = False,
) -> dict:
    """Add a specific product by its ID to the authenticated user's shopping cart.

    Args:
        product_id: The unique integer ID of the product.
        quantity: The quantity of the product to add (default 1).
        store_id: Optional supermarket ID.
        confirm: Confirmation flag to bypass interactive check.
    """
    if not confirm:
        return {
            "action_button": {
                "label": "Додати до кошика",
                "action": "add_to_cart",
                "payload": {
                    "product_id": product_id,
                    "quantity": quantity,
                    "store_id": store_id
                }
            }
        }

    if not ctx.deps.user_id:
        logger.bind(tool="add_product_to_cart").warning("Missing user_id in agent context")
        return {"error": "User is not authenticated. Cannot modify cart."}

    headers = {"X-User-Id": str(ctx.deps.user_id)}

    try:
        logger.bind(
            tool="add_product_to_cart",
            user_id=str(ctx.deps.user_id),
            product_id=product_id,
            quantity=quantity,
        ).info("Calling cart_service to add product")
        carts_response = await ctx.deps.http_client.get(
            f"{settings.CART_SERVICE_URL}/",
            headers=headers,
            timeout=3.0,
        )
        carts_response.raise_for_status()
        carts = carts_response.json()

        if not carts:
            create_response = await ctx.deps.http_client.post(
                f"{settings.CART_SERVICE_URL}/",
                json={"name": "Мій кошик"},
                headers=headers,
                timeout=3.0,
            )
            create_response.raise_for_status()
            cart_id = create_response.json()["id"]
        else:
            cart_id = carts[0]["id"]

        add_response = await ctx.deps.http_client.post(
            f"{settings.CART_SERVICE_URL}/{cart_id}/items",
            json={"product_id": product_id, "quantity": quantity},
            headers=headers,
            timeout=3.0,
        )
        add_response.raise_for_status()
        logger.bind(
            tool="add_product_to_cart",
            user_id=str(ctx.deps.user_id),
            product_id=product_id,
            quantity=quantity,
            cart_id=cart_id,
        ).info("Product added to cart successfully")
        return {"status": "success", "message": f"Товар #{product_id} додано до кошика (кількість: {quantity})."}
    except httpx.RequestError as e:
        logger.bind(
            tool="add_product_to_cart",
            user_id=str(ctx.deps.user_id),
            product_id=product_id,
            error=str(e),
        ).warning("cart_service unavailable")
        return {"error": "cart_service_unavailable", "detail": str(e)}
    except httpx.HTTPStatusError as e:
        logger.bind(
            tool="add_product_to_cart",
            user_id=str(ctx.deps.user_id),
            product_id=product_id,
            status_code=e.response.status_code,
        ).warning("cart_service returned error")
        return {"error": "cart_service_error", "status_code": e.response.status_code}


async def search_and_compare_offers(
    ctx: RunContext[AgentDeps],
    query: str,
    store_id: str | None = None,
    price_min: float | None = None,
    price_max: float | None = None,
    in_stock: bool = True,
) -> dict:
    """Search the product catalog and retrieve active store offers for the best matches in a single invocation.

    Args:
        query: The search term (e.g. 'молоко', 'хліб').
        store_id: Optional supermarket slug filter (e.g., 'atb', 'novus', 'metro', 'auchan').
        price_min: Optional minimum price filter in UAH.
        price_max: Optional maximum price filter in UAH.
        in_stock: Filter to only return items that are currently in stock (default True).
    """
    # 1. Caching key construction
    cache_key = f"search_offers:{query.strip().lower()}:{store_id or 'all'}:{price_min}:{price_max}:{in_stock}"
    redis_client = ctx.deps.redis_client

    if redis_client:
        try:
            cached_val = await redis_client.get(cache_key)
            if cached_val:
                logger.info(f"Cache hit for key {cache_key}")
                return json.loads(cached_val)
        except Exception as e:
            logger.warning(f"Failed to read from Redis cache: {e}")

    # 2. Query search_service
    params: dict = {"q": query, "in_stock": str(in_stock).lower()}
    if store_id:
        if store_id.lower() in ("atb", "silpo", "novus", "metro", "auchan", "varus", "ultramarket"):
            params["retail_chain"] = store_id
        else:
            params["store_id"] = store_id
    if price_min is not None:
        params["price_min"] = price_min
    if price_max is not None:
        params["price_max"] = price_max

    try:
        response = await ctx.deps.http_client.get(
            f"{settings.SEARCH_SERVICE_URL}/search",
            params=params,
            timeout=3.0,
        )
        response.raise_for_status()
        search_data = response.json()
    except Exception as e:
        logger.warning(f"search_service query failed: {e}")
        return {"error": "search_service_failed", "detail": str(e)}

    hits = search_data.get("hits", [])
    if not hits:
        return {
            "hits": [],
            "match_percentage": 0,
            "fallback": {
                "message": f"Не знайдено жодної пропозиції за запитом '{query}'",
                "suggestion": "Спробуйте змінити пошуковий запит або прибрати фільтри"
            }
        }

    # 3. Fetch offers for top 3 matching products in parallel
    top_hits = hits[:3]

    async def fetch_product_offers(product_id: int) -> dict:
        try:
            res = await ctx.deps.http_client.get(
                f"{settings.PRODUCT_SERVICE_URL}/products/{product_id}",
                timeout=3.0,
            )
            res.raise_for_status()
            return res.json()
        except Exception as err:
            logger.warning(f"Failed to fetch product offers for product {product_id}: {err}")
            return {"id": product_id, "error": str(err), "offers": []}

    tasks = [fetch_product_offers(hit["id"]) for hit in top_hits]
    offers_results = await asyncio.gather(*tasks, return_exceptions=True)

    # Combine hits and offers
    combined_hits = []
    for hit, offers_res in zip(top_hits, offers_results):
        if isinstance(offers_res, Exception):
            offers_data = {"id": hit["id"], "error": str(offers_res), "offers": []}
        else:
            offers_data = offers_res

        detailed_offers = offers_data.get("prices", []) or offers_data.get("offers", [])
        
        # Deep copy/re-construct the list to avoid modifying cached shared objects
        processed_offers = []
        for o in detailed_offers:
            processed_offers.append(dict(o))
            
        if processed_offers:
            cheapest = min(processed_offers, key=lambda o: float(o.get("price", 999999)))
            for o in processed_offers:
                o["highlighted"] = (o == cheapest)

        combined_hits.append({
            "product_info": hit,
            "detailed_offers": processed_offers
        })

    # Simple match percentage rule
    result = {
        "hits": combined_hits,
        "match_percentage": 90 if len(combined_hits) > 0 else 0
    }

    # Write to Redis Cache (5-minute TTL = 300 seconds)
    if redis_client:
        try:
            await redis_client.setex(cache_key, 300, json.dumps(result, ensure_ascii=False))
            logger.info(f"Cached results under key {cache_key}")
        except Exception as e:
            logger.warning(f"Failed to write to Redis cache: {e}")

    return result


async def clear_user_cart(ctx: RunContext[AgentDeps]) -> dict:
    """Clear all items from the authenticated user's shopping cart."""
    if not ctx.deps.user_id:
        logger.bind(tool="clear_user_cart").warning("Missing user_id in agent context")
        return {"error": "User is not authenticated. Cannot clear cart."}

    headers = {"X-User-Id": str(ctx.deps.user_id)}
    try:
        logger.bind(tool="clear_user_cart", user_id=str(ctx.deps.user_id)).info(
            "Fetching carts to clear"
        )
        carts_response = await ctx.deps.http_client.get(
            f"{settings.CART_SERVICE_URL}/",
            headers=headers,
            timeout=3.0,
        )
        carts_response.raise_for_status()
        carts = carts_response.json()

        if not carts:
            return {"status": "success", "message": "Кошик вже порожній."}

        cart_id = carts[0]["id"]
        logger.bind(tool="clear_user_cart", cart_id=cart_id).info("Clearing cart items")
        clear_response = await ctx.deps.http_client.delete(
            f"{settings.CART_SERVICE_URL}/{cart_id}/items",
            headers=headers,
            timeout=3.0,
        )
        clear_response.raise_for_status()
        return {"status": "success", "message": "Кошик успішно очищено від усіх товарів."}
    except httpx.RequestError as e:
        logger.bind(tool="clear_user_cart", error=str(e)).warning("cart_service unavailable")
        return {"error": "cart_service_unavailable", "detail": str(e)}
    except httpx.HTTPStatusError as e:
        logger.bind(tool="clear_user_cart", status_code=e.response.status_code).warning(
            "cart_service returned error"
        )
        return {"error": "cart_service_error", "status_code": e.response.status_code}


async def remove_item_from_cart(ctx: RunContext[AgentDeps], product_id: int) -> dict:
    """Remove a specific product by its ID from the authenticated user's shopping cart.

    Args:
        product_id: The unique integer ID of the product to remove.
    """
    if not ctx.deps.user_id:
        logger.bind(tool="remove_item_from_cart").warning("Missing user_id in agent context")
        return {"error": "User is not authenticated. Cannot modify cart."}

    headers = {"X-User-Id": str(ctx.deps.user_id)}
    try:
        logger.bind(tool="remove_item_from_cart", product_id=product_id).info(
            "Fetching carts to find item"
        )
        carts_response = await ctx.deps.http_client.get(
            f"{settings.CART_SERVICE_URL}/",
            headers=headers,
            timeout=3.0,
        )
        carts_response.raise_for_status()
        carts = carts_response.json()

        if not carts or not carts[0].get("items"):
            return {"error": "item_not_found", "message": "Товар не знайдено в кошику (кошик порожній)."}

        cart = carts[0]
        cart_id = cart["id"]
        
        # Find item matching product_id
        target_item = None
        for item in cart["items"]:
            if item["product_id"] == product_id:
                target_item = item
                break

        if not target_item:
            return {"error": "item_not_found", "message": f"Товар #{product_id} не знайдено у вашому кошику."}

        item_id = target_item["id"]
        logger.bind(
            tool="remove_item_from_cart", cart_id=cart_id, item_id=item_id, product_id=product_id
        ).info("Removing item from cart")

        remove_response = await ctx.deps.http_client.delete(
            f"{settings.CART_SERVICE_URL}/{cart_id}/items/{item_id}",
            headers=headers,
            timeout=3.0,
        )
        remove_response.raise_for_status()
        return {"status": "success", "message": f"Товар '{target_item['product_name']}' успішно видалено з кошика."}
    except httpx.RequestError as e:
        logger.bind(tool="remove_item_from_cart", error=str(e)).warning("cart_service unavailable")
        return {"error": "cart_service_unavailable", "detail": str(e)}
    except httpx.HTTPStatusError as e:
        logger.bind(tool="remove_item_from_cart", status_code=e.response.status_code).warning(
            "cart_service returned error"
        )
        return {"error": "cart_service_error", "status_code": e.response.status_code}


async def compare_cart_stores(ctx: RunContext[AgentDeps]) -> dict:
    """Compare the total price of the user's active shopping cart across all available supermarket chains."""
    if not ctx.deps.user_id:
        logger.bind(tool="compare_cart_stores").warning("Missing user_id in agent context")
        return {"error": "User is not authenticated. Cannot compare cart."}

    headers = {"X-User-Id": str(ctx.deps.user_id)}
    try:
        logger.bind(tool="compare_cart_stores").info("Fetching carts to compare")
        carts_response = await ctx.deps.http_client.get(
            f"{settings.CART_SERVICE_URL}/",
            headers=headers,
            timeout=3.0,
        )
        carts_response.raise_for_status()
        carts = carts_response.json()

        if not carts or not carts[0].get("items"):
            return {"error": "cart_empty", "message": "Ваш кошик порожній. Додайте товари перед порівнянням."}

        cart_id = carts[0]["id"]
        logger.bind(tool="compare_cart_stores", cart_id=cart_id).info("Comparing cart across stores")
        
        compare_response = await ctx.deps.http_client.get(
            f"{settings.CART_SERVICE_URL}/{cart_id}/compare",
            headers=headers,
            timeout=5.0,
        )
        compare_response.raise_for_status()
        return {"status": "success", "comparison": compare_response.json(), "cart_id": str(cart_id)}
    except httpx.RequestError as e:
        logger.bind(tool="compare_cart_stores", error=str(e)).warning("cart_service unavailable")
        return {"error": "cart_service_unavailable", "detail": str(e)}
    except httpx.HTTPStatusError as e:
        logger.bind(tool="compare_cart_stores", status_code=e.response.status_code).warning(
            "cart_service returned error"
        )
        return {"error": "cart_service_error", "status_code": e.response.status_code}


async def get_product_reviews(ctx: RunContext[AgentDeps], product_id: int) -> dict:
    """Retrieve all user reviews and ratings for a specific product by its ID.

    Args:
        product_id: The unique integer ID of the product.
    """
    try:
        logger.bind(tool="get_product_reviews", product_id=product_id).info(
            "Fetching reviews from reviews_service"
        )
        response = await ctx.deps.http_client.get(
            f"{settings.REVIEWS_SERVICE_URL}/product/{product_id}",
            timeout=3.0,
        )
        response.raise_for_status()
        return {"status": "success", "reviews": response.json()}
    except httpx.RequestError as e:
        logger.bind(tool="get_product_reviews", error=str(e)).warning("reviews_service unavailable")
        return {"error": "reviews_service_unavailable", "detail": str(e)}
    except httpx.HTTPStatusError as e:
        logger.bind(tool="get_product_reviews", status_code=e.response.status_code).warning(
            "reviews_service returned error"
        )
        return {"error": "reviews_service_error", "status_code": e.response.status_code}


async def create_product_review(
    ctx: RunContext[AgentDeps],
    product_id: int,
    rating: int,
    text: str | None = None,
) -> dict:
    """Submit a rating and comment review for a specific product.

    Args:
        product_id: The unique integer ID of the product.
        rating: The rating score from 1 to 5 stars.
        text: Optional comment text explaining the rating.
    """
    if not ctx.deps.user_id:
        logger.bind(tool="create_product_review").warning("Missing user_id in agent context")
        return {"error": "User is not authenticated. Cannot leave review."}

    headers = {"X-User-Id": str(ctx.deps.user_id)}
    # gateway adds X-User-Name, we can pass it if it was forwarded to zephyros_agent,
    # but reviews_service handles missing X-User-Name gracefully.

    try:
        logger.bind(
            tool="create_product_review", product_id=product_id, rating=rating
        ).info("Submitting new review to reviews_service")
        
        response = await ctx.deps.http_client.post(
            f"{settings.REVIEWS_SERVICE_URL}/",
            json={"product_id": product_id, "rating": rating, "text": text},
            headers=headers,
            timeout=3.0,
        )
        response.raise_for_status()
        return {"status": "success", "review": response.json()}
    except httpx.RequestError as e:
        logger.bind(tool="create_product_review", error=str(e)).warning("reviews_service unavailable")
        return {"error": "reviews_service_unavailable", "detail": str(e)}
    except httpx.HTTPStatusError as e:
        logger.bind(tool="create_product_review", status_code=e.response.status_code).warning(
            "reviews_service returned error"
        )
        return {"error": "reviews_service_error", "status_code": e.response.status_code}

