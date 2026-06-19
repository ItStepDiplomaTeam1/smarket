from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional


class ReviewCreate(BaseModel):
    product_id: int
    rating: int = Field(..., ge=1, le=5, description="Рейтинг від 1 до 5")
    text: Optional[str] = None


class ReviewResponse(BaseModel):
    id: UUID
    product_id: int
    user_id: UUID
    user_name: str
    rating: int
    text: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
