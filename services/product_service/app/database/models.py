"""
models.py — SQLAlchemy-моделі для product_service.

ВАЖЛИВО: Ці таблиці створюються та наповнюються виключно ETL-воркером (products_etl, Go).
product_service є READ-ONLY клієнтом цієї бази даних.
Alembic-міграції в цьому сервісі НЕ повинні створювати або видаляти ці таблиці.

Схема таблиць відповідає database/migrate.go із products_etl:
  - stores                   (PRIMARY KEY: external_id TEXT)
  - categories               (slug → name; плоский список верхнього рівня з Zakaz)
  - products                 (PRIMARY KEY: BIGSERIAL id, UNIQUE ean)
  - prices                   (лог цін: product_id → store_id → price)
  - store_products           (зв'язок товар ↔ магазин)
"""

import datetime
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    DateTime,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Store(Base):
    """
    Магазин з Zakaz.ua.
    PRIMARY KEY — external_id (рядок виду "48215610"), тобто зовнішній ID з Zakaz.
    """

    __tablename__ = "stores"

    external_id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    retail_chain: Mapped[str] = mapped_column(String, nullable=False)
    city: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    synced_at: Mapped[datetime.datetime] = mapped_column(
        "synced_at", DateTime(timezone=True), nullable=False
    )
    # Час останнього успішного парсингу ETL-воркером.
    # NULL означає: магазин ніколи не парсився.
    last_parsed_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        "last_parsed_at", DateTime(timezone=True), nullable=True
    )

    prices: Mapped[list["Price"]] = relationship("Price", back_populates="store")
    store_products: Mapped[list["StoreProduct"]] = relationship(
        "StoreProduct", back_populates="store"
    )


class Category(Base):
    """
    Категорія товару з Zakaz.ua (плоский список верхнього рівня).
    Наповнюється ETL-воркером: SeedCategories (при старті) + ліниве створення
    у ResolveCategoryID при зустрічі нового slug.
    """

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        "created_at", DateTime(timezone=True), nullable=False
    )
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # main_category_id — integer (1–10) that groups store-specific slugs into universal
    # top-level categories. Set by products_etl (category_mapping.go). Nullable for
    # legacy rows that predate the mapping feature.
    main_category_id: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True
    )

    products: Mapped[list["Product"]] = relationship(
        "Product", back_populates="category"
    )


class Product(Base):
    """
    Глобальний каталог товарів, дедублікований по EAN (штрихкод).
    Записується лише ETL-воркером (INSERT ... ON CONFLICT DO UPDATE).
    product_service лише читає.
    """

    __tablename__ = "products"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    ean: Mapped[Optional[str]] = mapped_column(
        "canonical_ean", String, unique=True, nullable=True
    )
    store_product_id: Mapped[Optional[str]] = mapped_column(
        "store_product_id", String, nullable=True
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    brand: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    weight: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column("image_url", Text, nullable=True)
    canonical_category_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    # ID магазину, до якого прив'язаний товар без EAN.
    # Для товарів з EAN це поле NULL (вони глобальні та можуть бути у будь-якому магазині).
    store_id: Mapped[Optional[str]] = mapped_column(
        "store_id", String, ForeignKey("stores.external_id"), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        "created_at", DateTime(timezone=True), nullable=False
    )
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    prices: Mapped[list["Price"]] = relationship("Price", back_populates="product")
    store_products: Mapped[list["StoreProduct"]] = relationship(
        "StoreProduct", back_populates="product"
    )
    category: Mapped[Optional["Category"]] = relationship(
        "Category", back_populates="products"
    )


class StoreProduct(Base):
    """
    Зв'язок товар ↔ магазин (junction table).
    Показує, які товари продаються в яких магазинах.
    Наповнюється ETL-воркером при кожному парсингу.
    """

    __tablename__ = "store_products"

    product_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("products.id"), primary_key=True
    )
    store_id: Mapped[str] = mapped_column(
        String, ForeignKey("stores.external_id"), primary_key=True
    )
    store_product_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    first_seen_at: Mapped[datetime.datetime] = mapped_column(
        "first_seen_at", DateTime(timezone=True), nullable=False
    )

    product: Mapped["Product"] = relationship(
        "Product", back_populates="store_products"
    )
    store: Mapped["Store"] = relationship("Store", back_populates="store_products")


class Price(Base):
    """
    Іммутабельний лог цін: кожен запис — ціна товару в конкретному магазині
    в момент часу recorded_at. Старі записи не видаляються — лише додаються нові.
    Ціни зберігаються в гривнях (UAH), наприклад 71.90.
    """

    __tablename__ = "prices"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("products.id"), nullable=False
    )
    store_id: Mapped[str] = mapped_column(
        String, ForeignKey("stores.external_id"), nullable=False
    )
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    old_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    in_stock: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    recorded_at: Mapped[datetime.datetime] = mapped_column(
        "recorded_at", DateTime(timezone=True), nullable=False, index=True
    )

    product: Mapped["Product"] = relationship("Product", back_populates="prices")
    store: Mapped["Store"] = relationship("Store", back_populates="prices")
