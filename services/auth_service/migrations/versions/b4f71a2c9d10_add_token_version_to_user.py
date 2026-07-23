"""add token version to user

Revision ID: b4f71a2c9d10
Revises: 92e472ddc4dd
Create Date: 2026-07-23
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b4f71a2c9d10"
down_revision: str | Sequence[str] | None = "92e472ddc4dd"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "User",
        sa.Column(
            "token_version",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )


def downgrade() -> None:
    op.drop_column("User", "token_version")
