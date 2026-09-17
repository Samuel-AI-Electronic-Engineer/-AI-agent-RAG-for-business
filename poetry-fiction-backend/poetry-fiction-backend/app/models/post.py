import enum
from datetime import datetime, timezone

from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, Enum, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ContentType(str, enum.Enum):
    POEM = "poema"
    STORY = "cuento"


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    excerpt: Mapped[str | None] = mapped_column(String(500), nullable=True)
    content_type: Mapped[ContentType] = mapped_column(
        Enum(ContentType), nullable=False, index=True
    )
    cover_image_url: Mapped[str | None] = mapped_column(
        String(500), nullable=True)
    tags: Mapped[str | None] = mapped_column(
        String(300), nullable=True,
        comment="Etiquetas separadas por comas: amor,tristeza,noche"
    )
    views: Mapped[int] = mapped_column(Integer, default=0)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Clave foránea al autor
    author_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    author: Mapped["User"] = relationship("User", back_populates="posts")  # noqa: F821

    @property
    def tags_list(self) -> list[str]:
        """Convierte el campo tags de string CSV a lista."""
        if not self.tags:
            return []
        return [t.strip() for t in self.tags.split(",") if t.strip()]

    @property
    def snippet(self) -> str | None:
        """Devuelve un texto corto para listados cuando no hay excerpt."""
        if self.excerpt:
            return self.excerpt
        if not self.content:
            return None
        preview = self.content.strip()
        return preview[:180].rstrip() + ("..." if len(preview) > 180 else "")

    def __repr__(self) -> str:
        return f"<Post id={self.id} title={self.title!r} type={self.content_type}>"
