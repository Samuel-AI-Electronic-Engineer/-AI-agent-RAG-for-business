"""Add editorial publication status and keep compatibility flag in sync.

Revision ID: 20260924_0002
Revises: 20260922_0001
Create Date: 2026-09-24
"""

from alembic import op
import sqlalchemy as sa


revision = "20260924_0002"
down_revision = "20260922_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    status_enum = sa.Enum(
        "draft",
        "pending_review",
        "published",
        "rejected",
        name="postpublicationstatus",
    )
    status_enum.create(bind, checkfirst=True)

    op.add_column(
        "posts",
        sa.Column(
            "publication_status",
            status_enum,
            nullable=True,
            server_default="draft",
        ),
    )

    op.execute(
        "UPDATE posts SET publication_status = CASE WHEN is_published THEN 'published' ELSE 'draft' END::postpublicationstatus WHERE publication_status IS NULL"
    )
    op.alter_column("posts", "publication_status",
                    nullable=False, server_default="draft")
    op.execute(
        "UPDATE posts SET is_published = (publication_status = 'published') WHERE is_published IS DISTINCT FROM (publication_status = 'published')"
    )
    op.create_index(op.f("ix_posts_publication_status"),
                    "posts", ["publication_status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_posts_publication_status"), table_name="posts")
    op.drop_column("posts", "publication_status")
