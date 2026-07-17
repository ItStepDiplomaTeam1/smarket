import uuid
import secrets
from fastapi import APIRouter, Depends, Header, HTTPException, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
import httpx
from loguru import logger


from app.database.session import get_db
from app.shared.schemas import (
    CartItemCreate,
    CartResponse,
    CartStoreComparison,
    CartCreate,
    CartItemUpdate,
    ReceiptResponse,
)
from app import crud
from app.external_api import (
    fetch_product_details, 
    fetch_product_offers,
    fetch_products_batch_details,
    fetch_products_batch_offers,
)


def get_http_client(request: Request) -> httpx.AsyncClient:
    return request.app.state.http_client


def get_user_id(x_user_id: uuid.UUID = Header(..., alias="X-User-Id")) -> uuid.UUID:
    return x_user_id


router = APIRouter(prefix="/cart", tags=["Cart"])


@router.get("/", response_model=list[CartResponse])
async def get_all_carts(
    user_id: uuid.UUID = Depends(get_user_id), 
    db: AsyncSession = Depends(get_db),
    http_client: httpx.AsyncClient = Depends(get_http_client),
):
    """Отримати список усіх кошиків користувача"""
    carts = await crud.get_user_carts(db, user_id)
    
    # Gather all items across all carts
    all_items = []
    for cart in carts:
        all_items.extend(cart.items)
        
    # Fetch details for all items in batch
    product_ids = list(set(item.product_id for item in all_items))
    product_details_list = await fetch_products_batch_details(http_client, product_ids)
    
    # Map from product_id to product_data
    product_data_map = {
        details.get("id"): details 
        for details in product_details_list
    }

    responses = []
    for cart in carts:
        total_price = 0.0
        items_response = []
        for item in cart.items:
            product_data = product_data_map.get(item.product_id, {})
            prices = product_data.get("prices", [])
            valid_prices = [p.get("price", 0.0) for p in prices if p.get("in_stock", False)]
            if valid_prices:
                price = min(valid_prices)
            else:
                all_prices = [p.get("price", 0.0) for p in prices]
                price = min(all_prices) if all_prices else 0.0
            
            name = product_data.get("title", "Невідомий товар")
            image_url = product_data.get("image_url")
            item_price = price * item.quantity
            total_price += item_price

            items_response.append(
                {
                    "id": item.id,
                    "cart_id": item.cart_id,
                    "product_id": item.product_id,
                    "quantity": item.quantity,
                    "product_name": name,
                    "price": price,
                    "image_url": image_url,
                }
            )

        responses.append(
            {
                "id": cart.id,
                "user_id": cart.user_id,
                "name": cart.name,
                "updated_at": cart.updated_at,
                "items": items_response,
                "total_price": total_price,
            }
        )
    return responses


@router.post("/", response_model=CartResponse)
async def create_new_cart(
    cart_in: CartCreate,
    user_id: uuid.UUID = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Створити новий кошик"""
    cart = await crud.create_cart(db, user_id, cart_in)
    return {
        "id": cart.id,
        "user_id": cart.user_id,
        "name": cart.name,
        "updated_at": cart.updated_at,
        "items": [],
        "total_price": 0.0,
    }


@router.get("/{cart_id}", response_model=CartResponse)
async def get_cart(
    cart_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
    http_client: httpx.AsyncClient = Depends(get_http_client),
):
    """Отримати конкретний кошик з товарами і цінами"""
    cart = await crud.get_cart(db, user_id, cart_id)
    if not cart:
        raise HTTPException(status_code=404, detail="Кошик не знайдено")

    cart_response = {
        "id": cart.id,
        "user_id": cart.user_id,
        "name": cart.name,
        "updated_at": cart.updated_at,
        "items": [],
        "total_price": 0.0,
    }
    
    # Fetch details for all items in batch
    product_ids = list(set(item.product_id for item in cart.items))
    product_details_list = await fetch_products_batch_details(http_client, product_ids)

    product_data_map = {
        details.get("id"): details 
        for details in product_details_list
    }

    total_price = 0.0
    for item in cart.items:
        product_data = product_data_map.get(item.product_id, {})
        name = product_data.get("title", "Невідомий товар")
        
        prices = product_data.get("prices", [])
        valid_prices = [p.get("price", 0.0) for p in prices if p.get("in_stock", False)]
        if valid_prices:
            price = min(valid_prices)
        else:
            all_prices = [p.get("price", 0.0) for p in prices]
            price = min(all_prices) if all_prices else 0.0

        image_url = product_data.get("image_url")
        item_price = price * item.quantity
        total_price += item_price

        cart_response["items"].append(
            {
                "id": item.id,
                "cart_id": item.cart_id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "product_name": name,
                "price": price,
                "image_url": image_url,
            }
        )

    cart_response["total_price"] = total_price
    return cart_response


@router.delete("/{cart_id}")
async def delete_cart(
    cart_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Видалити весь кошик"""
    success = await crud.delete_cart(db, user_id, cart_id)
    if not success:
        raise HTTPException(status_code=404, detail="Кошик не знайдено")
    return {"message": "Кошик успішно видалено"}


@router.post("/{cart_id}/items", response_model=CartResponse)
async def add_item_to_cart(
    cart_id: uuid.UUID,
    item_in: CartItemCreate,
    user_id: uuid.UUID = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
    http_client: httpx.AsyncClient = Depends(get_http_client),
):
    """Додати товар в конкретний кошик"""
    cart = await crud.add_item(db, user_id, cart_id, item_in)
    if not cart:
        raise HTTPException(status_code=404, detail="Кошик не знайдено")
    return await get_cart(cart_id, user_id, db, http_client)


@router.delete("/{cart_id}/items/{item_id}")
async def remove_item_from_cart(
    cart_id: uuid.UUID,
    item_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Видалити конкретний товар з кошика"""
    success = await crud.remove_item(db, user_id, cart_id, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Кошик або товар не знайдено")
    return {"message": "Товар успішно видалено"}


@router.put("/{cart_id}/items/{item_id}", response_model=CartResponse)
async def update_item_quantity(
    cart_id: uuid.UUID,
    item_id: uuid.UUID,
    item_in: CartItemUpdate,
    user_id: uuid.UUID = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
    http_client: httpx.AsyncClient = Depends(get_http_client),
):
    """Оновити кількість товару в кошику"""
    cart = await crud.update_item_quantity(db, user_id, cart_id, item_id, item_in.quantity)
    if not cart:
        raise HTTPException(status_code=404, detail="Кошик або товар не знайдено")
    return await get_cart(cart_id, user_id, db, http_client)


@router.delete("/{cart_id}/items")
async def clear_cart_items(
    cart_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Очистити всі товари в кошику"""
    success = await crud.clear_cart(db, user_id, cart_id)
    if not success:
        raise HTTPException(status_code=404, detail="Кошик не знайдено")
    return {"message": "Кошик очищено від товарів"}


async def _build_stores_comparison(cart, http_client: httpx.AsyncClient) -> tuple[list[dict], dict]:
    if not cart or not cart.items:
        return [], {}
    
    # Fetch offers for all items in batch
    product_ids = list(set(item.product_id for item in cart.items))
    offers_data_list = await fetch_products_batch_offers(http_client, product_ids)

    offers_data_map = {
        offer_data.get("id"): offer_data
        for offer_data in offers_data_list
    }

    stores_comparison = {}
    total_items_in_cart = len(cart.items)
    for item in cart.items:
        offers_data = offers_data_map.get(item.product_id, {})
        offers = offers_data.get("offers", [])
        for offer in offers:
            store = offer.get("store")
            if not store:
                continue
            store_id = store.get("external_id")
            price = offer.get("price", 0.0)
            in_stock = offer.get("in_stock", False)
            if store_id not in stores_comparison:
                stores_comparison[store_id] = {
                    "store_id": store_id,
                    "store_name": store.get("name"),
                    "retail_chain": store.get("retail_chain"),
                    "city": store.get("city"),
                    "address": store.get("address"),
                    "lat": store.get("lat"),
                    "lng": store.get("lng"),
                    "total_price": 0.0,
                    "found_items_count": 0,
                    "missing_items_count": total_items_in_cart,
                    "is_complete": False,
                }
            if in_stock:
                stores_comparison[store_id]["total_price"] += price * item.quantity
                stores_comparison[store_id]["found_items_count"] += 1
                stores_comparison[store_id]["missing_items_count"] -= 1

    for store_id, comp in stores_comparison.items():
        if comp["found_items_count"] == total_items_in_cart:
            comp["is_complete"] = True

    result_list = list(stores_comparison.values())
    result_list.sort(key=lambda x: (x["missing_items_count"], x["total_price"]))
    return result_list, offers_data_map


@router.get("/{cart_id}/compare", response_model=list[CartStoreComparison])
async def compare_cart_prices(
    cart_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
    http_client: httpx.AsyncClient = Depends(get_http_client),
):
    cart = await crud.get_cart(db, user_id, cart_id)
    result_list, _ = await _build_stores_comparison(cart, http_client)
    return result_list


async def _generate_ai_description(
    receipt_id: uuid.UUID,
    store_name: str,
    items_count: int,
    total_price: float,
    savings_amount: float,
):
    from app.database.session import _get_session_factory
    from app.config import settings
    from sqlalchemy import text
    url = f"{settings.ZEPHYROS_AGENT_URL}/agent/summarize-plan"
    payload = {
        "store_name": store_name,
        "items_count": items_count,
        "total_price": float(total_price),
        "savings_amount": float(savings_amount),
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload)
            if response.status_code == 200:
                data = response.json()
                summary_text = data.get("text")
                if summary_text:
                    async with _get_session_factory()() as db:
                        await db.execute(
                            text("UPDATE receipts SET ai_description = :text WHERE id = :id"),
                            {"text": summary_text, "id": receipt_id}
                        )
                        await db.commit()
                        logger.info(f"Successfully generated AI description for receipt {receipt_id}")
                else:
                    logger.warning(f"summarize-plan returned 200 but text is missing/empty: {data}")
            else:
                logger.error(f"Failed to generate AI description for receipt {receipt_id}: status {response.status_code}")
    except Exception as e:
        logger.exception(f"Error in background task generating AI description: {e}")


@router.post("/{cart_id}/complete", response_model=ReceiptResponse)
async def complete_cart(
    cart_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    user_id: uuid.UUID = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
    http_client: httpx.AsyncClient = Depends(get_http_client),
):
    cart = await crud.get_cart(db, user_id, cart_id)
    if not cart:
        raise HTTPException(status_code=404, detail="Кошик не знайдено")
    if not cart.items:
        raise HTTPException(status_code=422, detail="Кошик порожній")

    result_list, offers_data_map = await _build_stores_comparison(cart, http_client)
    if not result_list:
        raise HTTPException(status_code=422, detail="Не знайдено пропозицій для товарів у кошику")

    chosen_store_comp = result_list[0]
    chosen_store_id = chosen_store_comp["store_id"]

    # Filter complete stores to calculate savings
    complete_stores = [s for s in result_list if s.get("is_complete", False)]
    if complete_stores:
        if len(complete_stores) > 1:
            max_complete_price = max(s["total_price"] for s in complete_stores)
            savings_amount = max(0.0, max_complete_price - chosen_store_comp["total_price"])
        else:
            savings_amount = 0.0
    else:
        max_partial_price = max(s["total_price"] for s in result_list)
        savings_amount = max(0.0, max_partial_price - chosen_store_comp["total_price"])

    snapshot_items = []
    for item in cart.items:
        prod_data = offers_data_map.get(item.product_id, {})
        prod_name = prod_data.get("title", "Невідомий товар")
        
        store_offer = None
        for offer in prod_data.get("offers", []):
            if offer.get("store", {}).get("external_id") == chosen_store_id:
                store_offer = offer
                break
        
        if store_offer:
            in_stock = store_offer.get("in_stock", False)
            price = store_offer.get("price", 0.0)
        else:
            in_stock = False
            price = 0.0
            
        subtotal = price * item.quantity
        snapshot_items.append({
            "product_id": item.product_id,
            "name": prod_name,
            "quantity": item.quantity,
            "price": price,
            "subtotal": subtotal,
            "in_stock": in_stock
        })

    snapshot_store = {
        "store_id": chosen_store_id,
        "store_name": chosen_store_comp["store_name"],
        "retail_chain": chosen_store_comp["retail_chain"],
        "address": chosen_store_comp.get("address"),
        "lat": chosen_store_comp.get("lat"),
        "lng": chosen_store_comp.get("lng"),
        "is_complete": chosen_store_comp["is_complete"],
        "items": snapshot_items,
        "subtotal": chosen_store_comp["total_price"]
    }
    
    # Generate unique share token
    share_token = None
    for _ in range(10):
        tok = secrets.token_urlsafe(16)
        res = await db.execute(select(Receipt).where(Receipt.share_token == tok))
        if not res.scalar_one_or_none():
            share_token = tok
            break
    if not share_token:
        share_token = secrets.token_urlsafe(16)

    receipt = Receipt(
        user_id=user_id,
        cart_id=cart_id,
        total_price=chosen_store_comp["total_price"],
        savings_amount=savings_amount,
        share_token=share_token,
        ai_description=None,
        snapshot=[snapshot_store]
    )
    db.add(receipt)
    await db.delete(cart)
    await db.commit()
    await db.refresh(receipt)

    background_tasks.add_task(
        _generate_ai_description,
        receipt.id,
        chosen_store_comp["store_name"],
        len(snapshot_items),
        chosen_store_comp["total_price"],
        savings_amount
    )

    return receipt


@router.post("/{cart_id}/duplicate", response_model=CartResponse)
async def duplicate_cart_endpoint(
    cart_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
    http_client: httpx.AsyncClient = Depends(get_http_client),
):
    """Дублювати кошик"""
    new_cart = await crud.duplicate_cart(db, user_id, cart_id)
    if not new_cart:
        raise HTTPException(status_code=404, detail="Кошик не знайдено")
    return await get_cart(new_cart.id, user_id, db, http_client)


from app.database.models import Cart, Receipt
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.shared.schemas import ShareEmailRequest, ImportCartResponse

@router.get("/shared/{cart_id}", response_model=CartResponse)
async def get_shared_cart(
    cart_id: uuid.UUID, 
    db: AsyncSession = Depends(get_db),
    http_client: httpx.AsyncClient = Depends(get_http_client),
):
    """Отримати кошик за посиланням (без перевірки user_id)"""
    stmt = select(Cart).where(Cart.id == cart_id).options(selectinload(Cart.items))
    result = await db.execute(stmt)
    cart = result.scalars().first()

    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    # Fetch details for all items in batch
    product_ids = list(set(item.product_id for item in cart.items))
    product_details_list = await fetch_products_batch_details(http_client, product_ids)

    product_data_map = {
        details.get("id"): details 
        for details in product_details_list
    }

    total_price = 0.0
    items_response = []
    for item in cart.items:
        product_data = product_data_map.get(item.product_id, {})
        prices = product_data.get("prices", [])
        valid_prices = [p.get("price", 0.0) for p in prices if p.get("in_stock", False)]
        if valid_prices:
            price = min(valid_prices)
        else:
            all_prices = [p.get("price", 0.0) for p in prices]
            price = min(all_prices) if all_prices else 0.0
        
        name = product_data.get("title", "Невідомий товар")
        image_url = product_data.get("image_url")
        item_price = price * item.quantity
        total_price += item_price

        items_response.append(
            {
                "id": item.id,
                "cart_id": item.cart_id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "product_name": name,
                "price": price,
                "image_url": image_url,
            }
        )

    return {
        "id": cart.id,
        "user_id": cart.user_id,
        "name": cart.name,
        "updated_at": cart.updated_at,
        "items": items_response,
        "total_price": total_price,
    }


@router.post("/{cart_id}/share/email")
async def share_cart_by_email(
    cart_id: uuid.UUID,
    request: ShareEmailRequest,
    user_id: uuid.UUID = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Відправити посилання на спільний кошик через email"""
    cart = await crud.get_cart(db, user_id, cart_id)
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    from app.main import broker
    
    await broker.publish(
        {
            "email": request.email,
            "token": str(cart_id),
            "action": "share_cart",
        },
        queue="email_queue",
    )
    return {"message": "Email sent successfully"}


@router.post("/import/{shared_cart_id}", response_model=ImportCartResponse)
async def import_shared_cart(
    shared_cart_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Скопіювати товари зі спільного кошика у новий кошик поточного користувача"""
    stmt = select(Cart).where(Cart.id == shared_cart_id).options(selectinload(Cart.items))
    result = await db.execute(stmt)
    shared_cart = result.scalars().first()

    if not shared_cart:
        raise HTTPException(status_code=404, detail="Shared cart not found")

    new_cart_name = f"Копія: {shared_cart.name}"
    new_cart = await crud.create_cart(db, user_id, CartCreate(name=new_cart_name))

    for item in shared_cart.items:
        await crud.add_item(
            db, 
            user_id, 
            new_cart.id, 
            CartItemCreate(product_id=item.product_id, quantity=item.quantity)
        )

    return {"new_cart_id": new_cart.id, "message": "Cart imported successfully"}
