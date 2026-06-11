"""
models.py — SQLAlchemy-моделі для product_service.

ВАЖЛИВО: Ці таблиці створюються та наповнюються виключно ETL-воркером (products_etl, Go).
product_service є READ-ONLY клієнтом цієї бази даних.
Alembic-міграції в цьому сервісі НЕ повинні створювати або видаляти ці таблиці.

Схема таблиць відповідає database/migrate.go із products_etl:
  - stores                   (PRIMARY KEY: external_id TEXT)
  - store_categories_mapping (slug → canonical_category_id)
  - products                 (PRIMARY KEY: BIGSERIAL id, UNIQUE ean)
  - prices                   (лог цін: product_id → store_id → price)
"""
import datetime
from typing import Optional

from sqlalchemy import (
    BigInteger, Boolean, Float, ForeignKey,
    Integer, String, Text, DateTime
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

    prices: Mapped[list["Price"]] = relationship("Price", back_populates="store")


class StoreCategoryMapping(Base):
    """
    Маппінг: slug категорії з API Zakaz → наш внутрішній canonical_category_id.
    Наповнюється ETL-воркером при першому зіткненні з новою категорією.
    """
    __tablename__ = "store_categories_mapping"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    canonical_category_id: Mapped[int] = mapped_column(Integer, nullable=False)


class Product(Base):
    """
    Глобальний каталог товарів, дедублікований по EAN (штрихкод).
    Записується лише ETL-воркером (INSERT ... ON CONFLICT DO NOTHING).
    product_service лише читає.
    """
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    ean: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    brand: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    weight: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    canonical_category_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        "created_at", DateTime(timezone=True), nullable=False
    )

    prices: Mapped[list["Price"]] = relationship("Price", back_populates="product")


class Price(Base):
    """
    Іммутабельний лог цін: кожен запис — ціна товару в конкретному магазині
    в момент часу recorded_at. Старі записи не видаляються — лише додаються нові.
    """
    __tablename__ = "prices"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("products.id"), nullable=False
    )
    store_id: Mapped[str] = mapped_column(
        String, ForeignKey("stores.external_id"), nullable=False
    )
    price: Mapped[float] = mapped_column(Float, nullable=False)
    old_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    in_stock: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    recorded_at: Mapped[datetime.datetime] = mapped_column(
        "recorded_at", DateTime(timezone=True), nullable=False
    )

    product: Mapped["Product"] = relationship("Product", back_populates="prices")
    store: Mapped["Store"] = relationship("Store", back_populates="prices")