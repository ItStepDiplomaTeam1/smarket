import uuid
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.database.models import Receipt
from app.shared.schemas import ReceiptResponse, ReceiptListItem

router = APIRouter(prefix="/cart/receipts", tags=["Receipts"])


def get_user_id(x_user_id: uuid.UUID = Header(..., alias="X-User-Id")) -> uuid.UUID:
    return x_user_id


@router.get("", response_model=list[ReceiptListItem])
async def get_user_receipts(
    user_id: uuid.UUID = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Отримати список збережених чеків користувача"""
    stmt = select(Receipt).where(Receipt.user_id == user_id).order_by(Receipt.created_at.desc())
    result = await db.execute(stmt)
    receipts = result.scalars().all()
    
    items = []
    for r in receipts:
        # Extract store_name from snapshot
        store_name = "Невідомий магазин"
        if r.snapshot and len(r.snapshot) > 0:
            store_name = r.snapshot[0].get("store_name", store_name)
            
        items.append(
            ReceiptListItem(
                id=r.id,
                share_token=r.share_token,
                created_at=r.created_at,
                total_price=float(r.total_price),
                savings_amount=float(r.savings_amount),
                store_name=store_name,
            )
        )
    return items


@router.get("/{share_token}", response_model=ReceiptResponse)
async def get_receipt_by_token(
    share_token: str,
    db: AsyncSession = Depends(get_db),
):
    """Отримати повний чек за публічним токеном (без авторизації)"""
    stmt = select(Receipt).where(Receipt.share_token == share_token)
    result = await db.execute(stmt)
    receipt = result.scalar_one_or_none()
    
    if not receipt:
        raise HTTPException(status_code=404, detail="Чек не знайдено")
        
    return receipt


@router.delete("/{receipt_id}")
async def delete_user_receipt(
    receipt_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Видалити чек користувача"""
    stmt = select(Receipt).where(Receipt.id == receipt_id, Receipt.user_id == user_id)
    result = await db.execute(stmt)
    receipt = result.scalar_one_or_none()
    
    if not receipt:
        raise HTTPException(status_code=404, detail="Чек не знайдено")
        
    await db.delete(receipt)
    await db.commit()
    return {"status": "success", "message": "Чек успішно видалено"}
