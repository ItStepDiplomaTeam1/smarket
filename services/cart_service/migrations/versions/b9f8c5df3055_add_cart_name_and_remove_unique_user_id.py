"""add cart name and remove unique user_id

Revision ID: b9f8c5df3055
Revises: a8e7b4ce2f44
Create Date: 2026-06-18 11:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b9f8c5df3055'
down_revision: Union[str, None] = 'a8e7b4ce2f44'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns with a default for existing rows
    op.add_column('carts', sa.Column('name', sa.String(length=255), server_default='Мій кошик', nullable=False))
    op.add_column('carts', sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False))
    
    # Drop unique index on user_id and recreate as non-unique
    op.drop_index('ix_carts_user_id', table_name='carts')
    op.create_index('ix_carts_user_id', 'carts', ['user_id'], unique=False)


def downgrade() -> None:
    # Re-create unique index
    op.drop_index('ix_carts_user_id', table_name='carts')
    op.create_index('ix_carts_user_id', 'carts', ['user_id'], unique=True)
    
    # Drop columns
    op.drop_column('carts', 'updated_at')
    op.drop_column('carts', 'name')
