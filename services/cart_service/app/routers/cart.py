import uuid
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession


from app.database.session import get_db
from app.shared.schemas import (
    CartItemCreate,
    CartResponse,
    CartStoreComparison,
    CartCreate,
    CartItemUpdate,
)
from app import crud
from app.external_api import fetch_product_details, fetch_product_offers


def get_user_id(x_user_id: uuid.UUID = Header(..., alias="X-User-Id")) -> uuid.UUID:
    return x_user_id


router = APIRouter(prefix="/cart", tags=["Cart"])


@router.get("/", response_model=list[CartResponse])
async def get_all_carts(
    user_id: uuid.UUID = Depends(get_user_id), db: AsyncSession = Depends(get_db)
):
    """Отримати список усіх кошиків користувача"""
    carts = await crud.get_user_carts(db, user_id)
    import asyncio
    
    # Gather all items across all carts
    all_items = []
    for cart in carts:
        all_items.extend(cart.items)
        
    # Fetch details for all items in parallel
    product_details_list = await asyncio.gather(
        *(fetch_product_details(item.product_id) for item in all_items)
    )
    
    # Map from product_id to product_data
    product_data_map = {
        item.product_id: details 
        for item, details in zip(all_items, product_details_list)
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

    import asyncio
    
    # Fetch details for all items in parallel
    product_details_list = await asyncio.gather(
        *(fetch_product_details(item.product_id) for item in cart.items)
    )

    total_price = 0.0
    for item, product_data in zip(cart.items, product_details_list):
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
):
    """Додати товар в конкретний кошик"""
    cart = await crud.add_item(db, user_id, cart_id, item_in)
    if not cart:
        raise HTTPException(status_code=404, detail="Кошик не знайдено")
    return await get_cart(cart_id, user_id, db)


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
):
    """Оновити кількість товару в кошику"""
    cart = await crud.update_item_quantity(db, user_id, cart_id, item_id, item_in.quantity)
    if not cart:
        raise HTTPException(status_code=404, detail="Кошик або товар не знайдено")
    return await get_cart(cart_id, user_id, db)


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


@router.get("/{cart_id}/compare", response_model=list[CartStoreComparison])
async def compare_cart_prices(
    cart_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    cart = await crud.get_cart(db, user_id, cart_id)
    if not cart or not cart.items:
        return []

    import asyncio
    
    # Fetch offers for all items in parallel
    offers_data_list = await asyncio.gather(
        *(fetch_product_offers(item.product_id) for item in cart.items)
    )

    stores_comparison = {}
    total_items_in_cart = len(cart.items)
    for item, offers_data in zip(cart.items, offers_data_list):
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
    return result_list


@router.post("/{cart_id}/duplicate", response_model=CartResponse)
async def duplicate_cart_endpoint(
    cart_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Дублювати кошик"""
    new_cart = await crud.duplicate_cart(db, user_id, cart_id)
    if not new_cart:
        raise HTTPException(status_code=404, detail="Кошик не знайдено")
    return await get_cart(new_cart.id, user_id, db)


from app.database.models import Cart
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.shared.schemas import ShareEmailRequest, ImportCartResponse

@router.get("/shared/{cart_id}", response_model=CartResponse)
async def get_shared_cart(cart_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Отримати кошик за посиланням (без перевірки user_id)"""
    stmt = select(Cart).where(Cart.id == cart_id).options(selectinload(Cart.items))
    result = await db.execute(stmt)
    cart = result.scalars().first()

    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    import asyncio
    
    # Fetch details for all items in parallel
    product_details_list = await asyncio.gather(
        *(fetch_product_details(item.product_id) for item in cart.items)
    )

    total_price = 0.0
    items_response = []
    for item, product_data in zip(cart.items, product_details_list):
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
