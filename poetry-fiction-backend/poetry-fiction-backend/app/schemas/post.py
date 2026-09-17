from datetime import datetime
from pydantic import BaseModel, Field

from app.models.post import ContentType
from app.schemas.user import UserPublic


# ─── ENTRADA ─────────────────────────────────────────────────

class PostCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200,
                       example="Lluvia de palabras")
    content: str = Field(..., min_length=10, example="El viento susurra...")
    excerpt: str | None = Field(
        None, max_length=500, example="Un poema sobre...")
    content_type: ContentType = Field(..., example=ContentType.POEM)
    cover_image_url: str | None = Field(
        None, example="https://ejemplo.com/imagen.jpg")
    tags: str | None = Field(None, example="amor,lluvia,nostalgia")
    is_published: bool = Field(True)


class PostUpdate(BaseModel):
    title: str | None = Field(None, min_length=3, max_length=200)
    content: str | None = Field(None, min_length=10)
    excerpt: str | None = None
    content_type: ContentType | None = None
    cover_image_url: str | None = None
    tags: str | None = None
    is_published: bool | None = None
    is_featured: bool | None = None


# ─── SALIDA ───────────────────────────────────────────────────

class PostOut(BaseModel):
    id: int
    title: str
    content: str
    excerpt: str | None
    snippet: str | None
    content_type: ContentType
    cover_image_url: str | None
    tags: str | None
    tags_list: list[str] = []
    views: int
    is_published: bool
    is_featured: bool
    created_at: datetime
    updated_at: datetime
    author: UserPublic

    model_config = {"from_attributes": True}


class PostSummary(BaseModel):
    """Vista resumida para listados (sin contenido completo)."""
    id: int
    title: str
    excerpt: str | None
    snippet: str | None
    content_type: ContentType
    cover_image_url: str | None
    tags: str | None
    tags_list: list[str] = []
    views: int
    is_featured: bool
    created_at: datetime
    author: UserPublic

    model_config = {"from_attributes": True}


class PaginatedPosts(BaseModel):
    total: int
    page: int
    per_page: int
    pages: int
    items: list[PostSummary]
