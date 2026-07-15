"""add favorites table

Revision ID: c1d2e3f4a5b6
Revises: b9f8c5df3055
Create Date: 2026-07-15 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'c1d2e3f4a5b6'
down_revision = 'b9f8c5df3055'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'favorites',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('product_id', sa.BigInteger(), nullable=False),
        sa.Column('product_title', sa.String(500), nullable=True),
        sa.Column('product_image_url', sa.String(1000), nullable=True),
        sa.Column('product_price', sa.Float(), nullable=True),
        sa.Column('added_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_favorites_user_id', 'favorites', ['user_id'])
    op.create_unique_constraint('uq_favorites_user_product', 'favorites', ['user_id', 'product_id'])


def downgrade() -> None:
    op.drop_constraint('uq_favorites_user_product', 'favorites', type_='unique')
    op.drop_index('ix_favorites_user_id', table_name='favorites')
    op.drop_table('favorites')
