"""Create the initial schema without destructive changes.

Revision ID: 20260922_0001
Revises:
"""
from alembic import op

from app.database import Base
from app import models  # noqa: F401

revision = "20260922_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Idempotent for an existing local database: missing tables are created,
    # existing tables and data are preserved. Future schema changes use normal
    # explicit Alembic operations.
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    # The baseline is intentionally non-destructive. Create explicit downgrade
    # revisions for future changes instead of dropping production tables here.
    pass
