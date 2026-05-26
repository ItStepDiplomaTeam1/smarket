from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "d7a15e45750f"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "Category",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="category_name_unique"),
        sa.UniqueConstraint("slug", name="category_slug_unique"),
    )
    op.create_table(
        "Retailer",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("logo_url", sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="retailer_name_unique"),
    )
    op.create_table(
        "User",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_table(
        "Cart",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["User.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="cart_user_id_unique"),
    )
    op.create_table(
        "Product",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("category_id", sa.UUID(), nullable=False),
        sa.Column("external_id", sa.String(length=255), nullable=False),
        sa.Column("general_description", sa.String(length=255), nullable=False),
        sa.Column("specifications", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["Category.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "CartItem",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("cart_id", sa.UUID(), nullable=False),
        sa.Column("product_id", sa.UUID(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("added_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["cart_id"], ["Cart.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["Product.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "PriceHistory",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("product_id", sa.UUID(), nullable=False),
        sa.Column("retailer_id", sa.UUID(), nullable=False),
        sa.Column("price", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("recorded_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["Product.id"]),
        sa.ForeignKeyConstraint(["retailer_id"], ["Retailer.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "ProductPrice",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("product_id", sa.UUID(), nullable=False),
        sa.Column("retailer_id", sa.UUID(), nullable=False),
        sa.Column("price", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("discount_price", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("in_stock", sa.Boolean(), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["Product.id"]),
        sa.ForeignKeyConstraint(["retailer_id"], ["Retailer.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("ProductPrice")
    op.drop_table("PriceHistory")
    op.drop_table("CartItem")
    op.drop_table("Product")
    op.drop_table("Cart")
    op.drop_table("User")
    op.drop_table("Retailer")
    op.drop_table("Category")
