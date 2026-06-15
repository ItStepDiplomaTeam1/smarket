import uuid
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.models import Cart, CartItem
from app.shared.schemas import CartItemCreate

async def get_or_create_cart(db: AsyncSession, user_id: uuid.UUID) -> Cart:
    stmt = select(Cart).where(Cart.user_id == user_id).options(selectinload(Cart.items))
    result = await db.execute(stmt)
    cart = result.scalars().first()
    
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        await db.commit()
        await db.refresh(cart)
        
    return cart

async def add_item(db: AsyncSession, user_id: uuid.UUID, item_in: CartItemCreate) -> Cart:
    cart = await get_or_create_cart(db, user_id)
    
    stmt_item = select(CartItem).where(CartItem.cart_id == cart.id, CartItem.product_id == item_in.product_id)
    result_item = await db.execute(stmt_item)
    existing_item = result_item.scalars().first()
    
    if existing_item:
        existing_item.quantity += item_in.quantity
    else:
        new_item = CartItem(cart_id=cart.id, product_id=item_in.product_id, quantity=item_in.quantity)
        db.add(new_item)
        
    await db.commit()

    stmt_updated = select(Cart).where(Cart.id == cart.id).options(selectinload(Cart.items))
    res_updated = await db.execute(stmt_updated)
    return res_updated.scalars().first()

async def remove_item(db: AsyncSession, user_id: uuid.UUID, item_id: uuid.UUID):
    cart = await get_or_create_cart(db, user_id)
    stmt = delete(CartItem).where(CartItem.cart_id == cart.id, CartItem.id == item_id)
    await db.execute(stmt)
    await db.commit()

async def clear_cart(db: AsyncSession, user_id: uuid.UUID):
    cart = await get_or_create_cart(db, user_id)
    stmt = delete(CartItem).where(CartItem.cart_id == cart.id)
    await db.execute(stmt)
    await db.commit()