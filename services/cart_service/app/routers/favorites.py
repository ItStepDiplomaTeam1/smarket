import uuid
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.database.session import get_db
from app.database.models import Favorite
from app.shared.schemas import FavoriteAdd, FavoriteResponse


def get_user_id(x_user_id: uuid.UUID = Header(..., alias="X-User-Id")) -> uuid.UUID:
    return x_user_id


router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.get("/", response_model=list[FavoriteResponse])
async def get_favorites(
    user_id: uuid.UUID = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Отримати список улюблених товарів користувача (максимум 50)"""
    stmt = (
        select(Favorite)
        .where(Favorite.user_id == user_id)
        .order_by(Favorite.added_at.desc())
        .limit(50)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post("/", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED)
async def add_favorite(
    body: FavoriteAdd,
    user_id: uuid.UUID = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Додати товар до улюблених. Якщо вже існує — повертає існуючий запис."""
    # Check if already exists
    stmt_check = select(Favorite).where(
        Favorite.user_id == user_id,
        Favorite.product_id == body.product_id,
    )
    result = await db.execute(stmt_check)
    existing = result.scalars().first()
    if existing:
        # Update cached fields if provided
        if body.product_title:
            existing.product_title = body.product_title
        if body.product_image_url:
            existing.product_image_url = body.product_image_url
        if body.product_price is not None:
            existing.product_price = body.product_price
        await db.commit()
        await db.refresh(existing)
        return existing

    fav = Favorite(
        user_id=user_id,
        product_id=body.product_id,
        product_title=body.product_title,
        product_image_url=body.product_image_url,
        product_price=body.product_price,
    )
    db.add(fav)
    await db.commit()
    await db.refresh(fav)
    return fav


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favorite(
    product_id: int,
    user_id: uuid.UUID = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Видалити товар з улюблених"""
    stmt = delete(Favorite).where(
        Favorite.user_id == user_id,
        Favorite.product_id == product_id,
    )
    result = await db.execute(stmt)
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Товар не знайдено в улюблених")


@router.get("/ids", response_model=list[int])
async def get_favorite_ids(
    user_id: uuid.UUID = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Отримати тільки список product_id улюблених (для швидкої перевірки)"""
    stmt = select(Favorite.product_id).where(Favorite.user_id == user_id)
    result = await db.execute(stmt)
    return list(result.scalars().all())
