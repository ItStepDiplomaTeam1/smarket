"""add address lat lng to stores

Revision ID: ad2b8edbcbc2
Revises: 
Create Date: 2026-07-16 14:43:35.176352

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ad2b8edbcbc2'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TABLE stores ADD COLUMN IF NOT EXISTS address TEXT")
    op.execute("ALTER TABLE stores ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION")
    op.execute("ALTER TABLE stores ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION")


def downgrade() -> None:
    """Downgrade schema."""
    pass
