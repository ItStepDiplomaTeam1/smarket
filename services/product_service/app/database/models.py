import uuid
from typing import Any, Optional    


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
    store_products: Mapped[list["StoreProduct"]] = relationship("StoreProduct", back_populates="store")


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
    Записується лише ETL-воркером (INSERT ... ON CONFLICT DO UPDATE).
    product_service лише читає.
    """
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    specification: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=True, default=dict)
    image_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    

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
        "recorded_at", DateTime(timezone=True), nullable=False
    )

    product: Mapped["Product"] = relationship("Product", back_populates="prices")
    store: Mapped["Store"] = relationship("Store", back_populates="prices")