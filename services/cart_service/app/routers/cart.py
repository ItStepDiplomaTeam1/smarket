import uuid
from fastapi import APIRouter, Depends, Query, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

def get_user_id(x_user_id: uuid.UUID = Header(..., alias="X-User-Id")) -> uuid.UUID:
    return x_user_id

from app.database.session import get_db
from app.shared.schemas import CartItemCreate, CartResponse, CartStoreComparison, CartCreate
from app import crud
from app.external_api import fetch_product_details, fetch_product_offers

router = APIRouter(prefix="/cart", tags=["Cart"])

@router.get("/", response_model=list[CartResponse])
async def get_all_carts(user_id: uuid.UUID = Depends(get_user_id), db: AsyncSession = Depends(get_db)):
    """Отримати список усіх кошиків користувача"""
    carts = await crud.get_user_carts(db, user_id)
    responses = []
    for cart in carts:
        responses.append({
            "id": cart.id,
            "user_id": cart.user_id,
            "name": cart.name,
            "updated_at": cart.updated_at,
            "items": [],
            "total_price": 0.0
        })
    return responses

@router.post("/", response_model=CartResponse)
async def create_new_cart(cart_in: CartCreate, user_id: uuid.UUID = Depends(get_user_id), db: AsyncSession = Depends(get_db)):
    """Створити новий кошик"""
    cart = await crud.create_cart(db, user_id, cart_in)
    return {
        "id": cart.id,
        "user_id": cart.user_id,
        "name": cart.name,
        "updated_at": cart.updated_at,
        "items": [],
        "total_price": 0.0
    }

@router.get("/{cart_id}", response_model=CartResponse)
async def get_cart(cart_id: uuid.UUID, user_id: uuid.UUID = Depends(get_user_id), db: AsyncSession = Depends(get_db)):
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

@router.delete("/{cart_id}")
async def delete_cart(cart_id: uuid.UUID, user_id: uuid.UUID = Depends(get_user_id), db: AsyncSession = Depends(get_db)):
    """Видалити весь кошик"""
    success = await crud.delete_cart(db, user_id, cart_id)
    if not success:
        raise HTTPException(status_code=404, detail="Кошик не знайдено")
    return {"message": "Кошик успішно видалено"}

@router.post("/{cart_id}/items", response_model=CartResponse)
async def add_item_to_cart(cart_id: uuid.UUID, item_in: CartItemCreate, user_id: uuid.UUID = Depends(get_user_id), db: AsyncSession = Depends(get_db)):
    """Додати товар в конкретний кошик"""
    cart = await crud.add_item(db, user_id, cart_id, item_in)
    if not cart:
        raise HTTPException(status_code=404, detail="Кошик не знайдено")
    return await get_cart(cart_id, user_id, db)

@router.delete("/{cart_id}/items/{item_id}")
async def remove_item_from_cart(cart_id: uuid.UUID, item_id: uuid.UUID, user_id: uuid.UUID = Depends(get_user_id), db: AsyncSession = Depends(get_db)):
    """Видалити конкретний товар з кошика"""
    success = await crud.remove_item(db, user_id, cart_id, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Кошик або товар не знайдено")
    return {"message": "Товар успішно видалено"}

@router.delete("/{cart_id}/items")
async def clear_cart_items(cart_id: uuid.UUID, user_id: uuid.UUID = Depends(get_user_id), db: AsyncSession = Depends(get_db)):
    """Очистити всі товари в кошику"""
    success = await crud.clear_cart(db, user_id, cart_id)
    if not success:
        raise HTTPException(status_code=404, detail="Кошик не знайдено")
    return {"message": "Кошик очищено від товарів"}

@router.get("/{cart_id}/compare", response_model=list[CartStoreComparison])
async def compare_cart_prices(
    cart_id: uuid.UUID, user_id: uuid.UUID = Depends(get_user_id), db: AsyncSession = Depends(get_db)
):
    cart = await crud.get_cart(db, user_id, cart_id)
    if not cart or not cart.items:
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