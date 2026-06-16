import uuid
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class CartItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(default=1, gt=0, description="Кількість має бути більше 0")

class CartItemUpdate(BaseModel):
    quantity: int = Field(..., gt=0)

class CartItemResponse(BaseModel):
    id: uuid.UUID
    cart_id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    product_name: Optional[str] = None
    price: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)
class CartResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    items: List[CartItemResponse] = []
    total_price: float = 0.0
    
    model_config = ConfigDict(from_attributes=True)


class CartStoreComparison(BaseModel):
    store_id: str
    store_name: str
    retail_chain: str
    city: Optional[str] = None
    total_price: float
    found_items_count: int
    missing_items_count: int
    is_complete: bool

    model_config = ConfigDict(from_attributes=True)