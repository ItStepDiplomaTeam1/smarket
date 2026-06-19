"""change product_id from uuid to bigint

Revision ID: ef8fd0a6bdd7
Revises: cf5b0dc66e95
Create Date: 2026-06-16 23:03:45.618457

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "ef8fd0a6bdd7"
down_revision: Union[str, Sequence[str], None] = "cf5b0dc66e95"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # UUID cannot be cast to BIGINT — drop and recreate the column.
    # Existing review rows will lose their product_id (dev environment).
    op.drop_column("reviews", "product_id")
    op.add_column("reviews", sa.Column("product_id", sa.BigInteger(), nullable=False))
    op.create_index(
        op.f("ix_reviews_product_id"), "reviews", ["product_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_reviews_product_id"), table_name="reviews")
    op.drop_column("reviews", "product_id")
    op.add_column("reviews", sa.Column("product_id", sa.UUID(), nullable=False))
    op.create_index(
        op.f("ix_reviews_product_id"), "reviews", ["product_id"], unique=False
    )
