import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.database.session import get_db
from app.shared.schemas import ReviewCreate, ReviewResponse
from app import crud
from app.proxy_auth import get_current_user


# Схема для оновлення відгуку
class ReviewUpdate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    text: str | None = None


router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.get("/product/{product_id}", response_model=list[ReviewResponse])
async def get_product_reviews(product_id: int, db: AsyncSession = Depends(get_db)):
    """Отримати всі відгуки для конкретного товару"""
    return await crud.get_reviews_by_product(db, product_id)


@router.post("/", response_model=ReviewResponse)
async def add_review(
    review_in: ReviewCreate,
    user: tuple[str, str] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Додати новий відгук до товару"""
    user_id, user_name = user
    return await crud.create_review(db, review_in, uuid.UUID(user_id), user_name)


@router.put("/{review_id}", response_model=ReviewResponse)
async def edit_review(
    review_id: uuid.UUID,
    review_update: ReviewUpdate,
    user: tuple[str, str] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Редагувати власний відгук"""
    user_id, _ = user
    updated_review = await crud.update_review(
        db=db,
        review_id=review_id,
        user_id=uuid.UUID(user_id),
        rating=review_update.rating,
        text=review_update.text,
    )

    if not updated_review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Відгук не знайдено або у вас немає прав на його редагування",
        )
    return updated_review


@router.delete("/{review_id}")
async def remove_review(
    review_id: uuid.UUID,
    user: tuple[str, str] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Видалити конкретний відгук"""
    user_id, _ = user
    success = await crud.delete_review(db, review_id, uuid.UUID(user_id))

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Відгук не знайдено або у вас немає прав на його видалення",
        )
    return {"message": "Відгук успішно видалено"}
