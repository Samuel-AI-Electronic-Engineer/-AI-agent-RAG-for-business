"""Add rejection reason to posts for editorial moderation feedback.

Revision ID: 20260925_0003
Revises: 20260924_0002
Create Date: 2026-09-25
"""

from alembic import op
import sqlalchemy as sa


revision = "20260925_0003"
down_revision = "20260924_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "posts",
        sa.Column("rejection_reason", sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("posts", "rejection_reason")
