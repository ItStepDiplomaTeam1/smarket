import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.shared.schemas import CartItemCreate, CartResponse, CartStoreComparison
from app import crud
from app.external_api import fetch_product_details, fetch_product_offers

router = APIRouter(prefix="/cart", tags=["Cart"])

@router.get("/", response_model=CartResponse)
async def get_cart(user_id: uuid.UUID = Query(...), db: AsyncSession = Depends(get_db)):
    """Отримати корзину користувача з реальними цінами та назвами"""
    cart = await crud.get_or_create_cart(db, user_id)
    cart_response = {
        "id": cart.id,
        "user_id": cart.user_id,
        "items": [],
        "total_price": 0.0
    }
    
    total_price = 0.0
    
    for item in cart.items:
        product_data = await fetch_product_details(item.product_id)
        price = product_data.get("price", 0.0)
        name = product_data.get("name", "Невідомий товар")
        
        item_price = price * item.quantity
        total_price += item_price
        
        cart_response["items"].append({
            "id": item.id,
            "cart_id": item.cart_id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "product_name": name,
            "price": price
        })
        
    cart_response["total_price"] = total_price
    
    return cart_response

@router.post("/items", response_model=CartResponse)
async def add_item_to_cart(item_in: CartItemCreate, user_id: uuid.UUID = Query(...), db: AsyncSession = Depends(get_db)):
    """Додати товар в корзину"""
    return await crud.add_item(db, user_id, item_in)

@router.delete("/items/{item_id}")
async def remove_item_from_cart(item_id: uuid.UUID, user_id: uuid.UUID = Query(...), db: AsyncSession = Depends(get_db)):
    """Видалити конкретний товар з корзини"""
    await crud.remove_item(db, user_id, item_id)
    return {"message": "Товар успішно видалено"}

@router.delete("/")
async def clear_cart(user_id: uuid.UUID = Query(...), db: AsyncSession = Depends(get_db)):
    """Очистити всю корзину"""
    await crud.clear_cart(db, user_id)
    return {"message": "Корзину очищено"}


@router.get("/compare", response_model=list[CartStoreComparison])
async def compare_cart_prices(
    user_id: uuid.UUID = Query(...), db: AsyncSession = Depends(get_db)
):
    cart = await crud.get_or_create_cart(db, user_id)
    if not cart.items:
        return []
    stores_comparison = {}
    total_items_in_cart = len(cart.items)
    for item in cart.items:
        offers_data = await fetch_product_offers(item.product_id)
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