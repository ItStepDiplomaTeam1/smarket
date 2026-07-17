import uuid
from typing import Optional
from datetime import datetime
from sqlalchemy import String, BigInteger, Float, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.types import TIMESTAMP
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


class Cart(Base):
    __tablename__ = "carts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="Мій кошик")
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    items: Mapped[list["CartItem"]] = relationship(
        "CartItem", back_populates="cart", cascade="all, delete-orphan"
    )


class CartItem(Base):
    __tablename__ = "cart_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    cart_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("carts.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[int] = mapped_column(BigInteger, index=True, nullable=False)
    quantity: Mapped[int] = mapped_column(BigInteger, nullable=False)
    added_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )

    cart: Mapped["Cart"] = relationship("Cart", back_populates="items")


class Favorite(Base):
    __tablename__ = "favorites"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), index=True, nullable=False
    )
    product_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    product_title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    product_image_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    product_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    added_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )


class Receipt(Base):
    __tablename__ = "receipts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), index=True, nullable=False
    )
    cart_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )
    total_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    savings_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    share_token: Mapped[str] = mapped_column(
        String(32), unique=True, index=True, nullable=False
    )
    ai_description: Mapped[Optional[str]] = mapped_column(
        String, nullable=True
    )
    snapshot: Mapped[list] = mapped_column(JSONB, nullable=False)

