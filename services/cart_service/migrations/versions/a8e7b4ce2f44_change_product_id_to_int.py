"""change product_id to int

Revision ID: a8e7b4ce2f44
Revises: 77e7b4ce2f43
Create Date: 2026-06-16 23:59:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a8e7b4ce2f44"
down_revision: Union[str, Sequence[str], None] = "77e7b4ce2f43"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Clear existing cart items to prevent NotNullViolationError on product_id type change
    op.execute("DELETE FROM cart_items")

    # Drop index if it exists
    op.drop_index(op.f("ix_cart_items_product_id"), table_name="cart_items")
    # Drop column and recreate as BigInteger
    op.drop_column("cart_items", "product_id")
    op.add_column(
        "cart_items", sa.Column("product_id", sa.BigInteger(), nullable=False)
    )
    # Recreate index
    op.create_index(
        op.f("ix_cart_items_product_id"), "cart_items", ["product_id"], unique=False
    )


def downgrade() -> None:
    op.execute("DELETE FROM cart_items")
    op.drop_index(op.f("ix_cart_items_product_id"), table_name="cart_items")
    op.drop_column("cart_items", "product_id")
    op.add_column("cart_items", sa.Column("product_id", sa.UUID(), nullable=False))
    op.create_index(
        op.f("ix_cart_items_product_id"), "cart_items", ["product_id"], unique=False
    )
