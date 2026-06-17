import uuid
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.database.session import get_db
from app.shared.schemas import ReviewCreate, ReviewResponse
from app import crud

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
    user_id: uuid.UUID = Query(...),
    user_name: str = Query("Користувач", description="Тимчасово передаємо ім'я через Query"),
    db: AsyncSession = Depends(get_db)
):
    """Додати новий відгук до товару"""
    return await crud.create_review(db, review_in, user_id, user_name)


@router.put("/{review_id}", response_model=ReviewResponse)
async def edit_review(
    review_id: uuid.UUID,
    review_update: ReviewUpdate,
    user_id: uuid.UUID = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Редагувати власний відгук"""
    updated_review = await crud.update_review(
        db=db, 
        review_id=review_id, 
        user_id=user_id, 
        rating=review_update.rating, 
        text=review_update.text
    )
    
    if not updated_review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Відгук не знайдено або у вас немає прав на його редагування"
        )
    return updated_review


@router.delete("/{review_id}")
async def remove_review(
    review_id: uuid.UUID,
    user_id: uuid.UUID = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Видалити конкретний відгук"""
    success = await crud.delete_review(db, review_id, user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Відгук не знайдено або у вас немає прав на його видалення"
        )
    return {"message": "Відгук успішно видалено"}