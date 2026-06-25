import sys

with open('app/crud.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_crud_code = '''

async def duplicate_cart(db: AsyncSession, user_id: uuid.UUID, cart_id: uuid.UUID):
    original_cart = await get_cart(db, user_id, cart_id)
    if not original_cart:
        return None
    
    new_cart = Cart(user_id=user_id, name=original_cart.name + " (Копія)")
    db.add(new_cart)
    await db.flush()
    
    for item in original_cart.items:
        new_item = CartItem(cart_id=new_cart.id, product_id=item.product_id, quantity=item.quantity)
        db.add(new_item)
        
    await db.commit()
    await db.refresh(new_cart)
    
    stmt = select(Cart).where(Cart.id == new_cart.id).options(selectinload(Cart.items))
    res = await db.execute(stmt)
    return res.scalars().first()
'''

content += new_crud_code

with open('app/crud.py', 'w', encoding='utf-8') as f:
    f.write(content)

with open('app/routers/cart.py', 'r', encoding='utf-8') as f:
    cart_content = f.read()

new_router_code = '''

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
'''

cart_content += new_router_code

with open('app/routers/cart.py', 'w', encoding='utf-8') as f:
    f.write(cart_content)

print("Backend updated successfully!")
