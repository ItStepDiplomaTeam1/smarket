"""enforce one review per user and product

Revision ID: a8c31e4d7f20
Revises: ef8fd0a6bdd7
Create Date: 2026-07-23
"""

from typing import Sequence, Union

from alembic import op

revision: str = "a8c31e4d7f20"
down_revision: Union[str, Sequence[str], None] = "ef8fd0a6bdd7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Preserve the newest review and remove older duplicates before enforcing
    # the invariant. This is deterministic even when timestamps are equal.
    op.execute(
        """
        DELETE FROM reviews AS older
        USING reviews AS newer
        WHERE older.user_id = newer.user_id
          AND older.product_id = newer.product_id
          AND (older.created_at, older.id) < (newer.created_at, newer.id)
        """
    )
    op.create_unique_constraint(
        "uq_reviews_user_product",
        "reviews",
        ["user_id", "product_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_reviews_user_product",
        "reviews",
        type_="unique",
    )
