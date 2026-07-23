import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class FavoriteAdd(BaseModel):
    product_id: int
    product_title: Optional[str] = None
    product_image_url: Optional[str] = None
    product_price: Optional[float] = None


class FavoriteResponse(BaseModel):
    id: uuid.UUID
    product_id: int
    product_title: Optional[str] = None
    product_image_url: Optional[str] = None
    product_price: Optional[float] = None
    added_at: datetime

    model_config = ConfigDict(from_attributes=True)



class CartCreate(BaseModel):
    name: str = Field(..., description="Назва кошика")


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(default=1, gt=0, description="Кількість має бути більше 0")


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., gt=0)


class CartItemResponse(BaseModel):
    id: uuid.UUID
    cart_id: uuid.UUID
    product_id: int
    quantity: int
    product_name: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CartResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    updated_at: datetime
    items: List[CartItemResponse] = []
    total_price: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class SharedCartItemResponse(BaseModel):
    id: uuid.UUID
    product_id: int
    quantity: int
    product_name: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None


class SharedCartResponse(BaseModel):
    id: uuid.UUID
    name: str
    updated_at: datetime
    items: List[SharedCartItemResponse] = Field(default_factory=list)
    total_price: float = 0.0


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


class ShareEmailRequest(BaseModel):
    email: str = Field(..., description="Електронна адреса для відправки листа")


class ImportCartResponse(BaseModel):
    new_cart_id: uuid.UUID
    message: str


class ReceiptSnapshotItem(BaseModel):
    product_id: int
    name: str
    quantity: int
    price: float
    subtotal: float
    in_stock: bool


class ReceiptSnapshotStore(BaseModel):
    store_id: str
    store_name: str
    retail_chain: str
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    is_complete: bool
    items: List[ReceiptSnapshotItem]
    subtotal: float


class ReceiptResponse(BaseModel):
    id: uuid.UUID
    cart_id: Optional[uuid.UUID] = None
    created_at: datetime
    total_price: float
    savings_amount: float
    share_token: str
    ai_description: Optional[str] = None
    snapshot: List[ReceiptSnapshotStore]

    model_config = ConfigDict(from_attributes=True)


class ReceiptListItem(BaseModel):
    id: uuid.UUID
    share_token: str
    created_at: datetime
    total_price: float
    savings_amount: float
    store_name: str

    model_config = ConfigDict(from_attributes=True)

