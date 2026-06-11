import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class StoreResponse(BaseModel):
    external_id: str
    name: str
    retail_chain: str
    city: Optional[str] = None
    is_active: bool
    synced_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)



class PriceResponse(BaseModel):
    id: int
    product_id: int
    store_id: str
    price: float
    old_price: Optional[float] = None
    in_stock: bool
    recorded_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class ProductResponse(BaseModel):
    id: int
    ean: str
    title: str
    brand: Optional[str] = None
    unit: Optional[str] = None
    weight: Optional[float] = None
    canonical_category_id: Optional[int] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class ProductDetail(ProductResponse):
    prices: list[PriceResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ProductFilters(BaseModel):
    category_id: Optional[int] = None
    brand: Optional[str] = None
    in_stock: Optional[bool] = None
    store_id: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    skip: int = 0
    limit: int = 100