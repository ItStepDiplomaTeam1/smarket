import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.types import TIMESTAMP


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "User"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(255), nullable=False, default="user")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    cart: Mapped["Cart"] = relationship("Cart", back_populates="user", uselist=False)


class Category(Base):
    __tablename__ = "Category"
    __table_args__ = (
        UniqueConstraint("name", name="category_name_unique"),
        UniqueConstraint("slug", name="category_slug_unique"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)

    # Relationships
    products: Mapped[list["Product"]] = relationship("Product", back_populates="category")


class Retailer(Base):
    __tablename__ = "Retailer"
    __table_args__ = (UniqueConstraint("name", name="retailer_name_unique"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    logo_url: Mapped[str] = mapped_column(String(255), nullable=False)

    # Relationships
    product_prices: Mapped[list["ProductPrice"]] = relationship(
        "ProductPrice", back_populates="retailer"
    )
    price_history: Mapped[list["PriceHistory"]] = relationship(
        "PriceHistory", back_populates="retailer"
    )


class Product(Base):
    __tablename__ = "Product"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("Category.id"), nullable=False
    )
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    general_description: Mapped[str] = mapped_column(String(255), nullable=False)
    specifications: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # Relationships
    category: Mapped["Category"] = relationship("Category", back_populates="products")
    product_prices: Mapped[list["ProductPrice"]] = relationship(
        "ProductPrice", back_populates="product"
    )
    price_history: Mapped[list["PriceHistory"]] = relationship(
        "PriceHistory", back_populates="product"
    )
    cart_items: Mapped[list["CartItem"]] = relationship(
        "CartItem", back_populates="product"
    )


class ProductPrice(Base):
    __tablename__ = "ProductPrice"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("Product.id"), nullable=False
    )
    retailer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("Retailer.id"), nullable=False
    )
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    discount_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    in_stock: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="product_prices")
    retailer: Mapped["Retailer"] = relationship("Retailer", back_populates="product_prices")


class PriceHistory(Base):
    __tablename__ = "PriceHistory"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("Product.id"), nullable=False
    )
    retailer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("Retailer.id"), nullable=False
    )
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="price_history")
    retailer: Mapped["Retailer"] = relationship("Retailer", back_populates="price_history")


class Cart(Base):
    __tablename__ = "Cart"
    __table_args__ = (UniqueConstraint("user_id", name="cart_user_id_unique"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("User.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="cart")
    items: Mapped[list["CartItem"]] = relationship("CartItem", back_populates="cart")


class CartItem(Base):
    __tablename__ = "CartItem"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    cart_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("Cart.id"), nullable=False
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("Product.id"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    added_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    cart: Mapped["Cart"] = relationship("Cart", back_populates="items")
    product: Mapped["Product"] = relationship("Product", back_populates="cart_items")