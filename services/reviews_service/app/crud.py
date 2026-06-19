import uuid
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import Review
from app.shared.schemas import ReviewCreate


# 1. Отримати всі відгуки для конкретного товару
async def get_reviews_by_product(db: AsyncSession, product_id: int):
    stmt = (
        select(Review)
        .where(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


# 2. Додати новий відгук
async def create_review(
    db: AsyncSession, review_in: ReviewCreate, user_id: uuid.UUID, user_name: str
) -> Review:
    new_review = Review(
        product_id=review_in.product_id,
        user_id=user_id,
        user_name=user_name,
        rating=review_in.rating,
        text=review_in.text,
    )
    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)
    return new_review


# 3. Редагувати свій відгук
async def update_review(
    db: AsyncSession, review_id: uuid.UUID, user_id: uuid.UUID, rating: int, text: str
) -> Review | None:
    stmt = select(Review).where(Review.id == review_id, Review.user_id == user_id)
    result = await db.execute(stmt)
    existing_review = result.scalars().first()

    if existing_review:
        existing_review.rating = rating
        existing_review.text = text
        await db.commit()
        await db.refresh(existing_review)
        return existing_review

    return None


# 4. Видалити свій відгук
async def delete_review(
    db: AsyncSession, review_id: uuid.UUID, user_id: uuid.UUID
) -> bool:
    stmt = delete(Review).where(Review.id == review_id, Review.user_id == user_id)
    result = await db.execute(stmt)
    await db.commit()

    return result.rowcount > 0
