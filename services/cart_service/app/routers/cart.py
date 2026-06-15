import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.shared.schemas import CartItemCreate, CartResponse
from app import crud
from app.external_api import fetch_product_details

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