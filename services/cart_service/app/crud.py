import uuid
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.models import Cart, CartItem
from app.shared.schemas import CartItemCreate, CartCreate

async def create_cart(db: AsyncSession, user_id: uuid.UUID, cart_in: CartCreate) -> Cart:
    cart = Cart(user_id=user_id, name=cart_in.name)
    db.add(cart)
    await db.commit()
    await db.refresh(cart)
    # Return with empty items list loaded
    stmt = select(Cart).where(Cart.id == cart.id).options(selectinload(Cart.items))
    res = await db.execute(stmt)
    return res.scalars().first()

async def get_user_carts(db: AsyncSession, user_id: uuid.UUID) -> list[Cart]:
    stmt = select(Cart).where(Cart.user_id == user_id).order_by(Cart.updated_at.desc()).options(selectinload(Cart.items))
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def get_cart(db: AsyncSession, user_id: uuid.UUID, cart_id: uuid.UUID) -> Cart | None:
    stmt = select(Cart).where(Cart.id == cart_id, Cart.user_id == user_id).options(selectinload(Cart.items))
    result = await db.execute(stmt)
    return result.scalars().first()

async def delete_cart(db: AsyncSession, user_id: uuid.UUID, cart_id: uuid.UUID) -> bool:
    cart = await get_cart(db, user_id, cart_id)
    if not cart:
        return False
    stmt = delete(Cart).where(Cart.id == cart_id)
    await db.execute(stmt)
    await db.commit()
    return True

async def add_item(db: AsyncSession, user_id: uuid.UUID, cart_id: uuid.UUID, item_in: CartItemCreate) -> Cart | None:
    cart = await get_cart(db, user_id, cart_id)
    if not cart:
        return None
    
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

async def remove_item(db: AsyncSession, user_id: uuid.UUID, cart_id: uuid.UUID, item_id: uuid.UUID) -> bool:
    cart = await get_cart(db, user_id, cart_id)
    if not cart:
        return False
    stmt = delete(CartItem).where(CartItem.cart_id == cart.id, CartItem.id == item_id)
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount > 0

async def clear_cart(db: AsyncSession, user_id: uuid.UUID, cart_id: uuid.UUID) -> bool:
    cart = await get_cart(db, user_id, cart_id)
    if not cart:
        return False
    stmt = delete(CartItem).where(CartItem.cart_id == cart.id)
    await db.execute(stmt)
    await db.commit()
    return True