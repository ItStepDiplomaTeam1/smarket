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


class CategoryResponse(BaseModel):
    id: int
    slug: str
    name: str

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


class PriceWithStoreResponse(PriceResponse):
    """Ціна з інформацією про магазин (для фронтенду — не потрібен окремий запит)."""

    store: StoreResponse

    model_config = ConfigDict(from_attributes=True)


class ProductResponse(BaseModel):
    id: int
    ean: Optional[str] = None
    store_product_id: Optional[str] = None
    title: str
    brand: Optional[str] = None
    unit: Optional[str] = None
    weight: Optional[float] = None
    image_url: Optional[str] = None
    canonical_category_id: Optional[int] = None
    category: Optional[CategoryResponse] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class ProductDetail(ProductResponse):
    """Товар з усіма цінами (включно з інформацією про магазин)."""

    prices: list[PriceWithStoreResponse] = []

    model_config = ConfigDict(from_attributes=True)


class StoreProductResponse(BaseModel):
    """Зв'язок товар ↔ магазин (в якому магазині є товар)."""

    store_id: str
    store_product_id: Optional[str] = None
    first_seen_at: datetime.datetime
    store: StoreResponse

    model_config = ConfigDict(from_attributes=True)


class ProductWithStoresResponse(ProductResponse):
    """Товар зі списком магазинів, де він продається."""

    store_products: list[StoreProductResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ProductInStoreResponse(ProductResponse):
    """Товар з актуальною ціною для конкретного магазину."""

    latest_price: Optional[PriceResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ProductOfferResponse(BaseModel):
    """Актуальна пропозиція товару в одному магазині (ціна + магазин)."""

    store: StoreResponse
    price: float
    old_price: Optional[float] = None
    in_stock: bool
    recorded_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class ProductOffersResponse(ProductResponse):
    """Товар з актуальними цінами в усіх магазинах — зручний агрегат для фронтенду."""

    offers: list[ProductOfferResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ProductFilters(BaseModel):
    category_id: Optional[int] = None
    brand: Optional[str] = None
    in_stock: Optional[bool] = None
    store_id: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    search: Optional[str] = None
    skip: int = 0
    limit: int = 100



