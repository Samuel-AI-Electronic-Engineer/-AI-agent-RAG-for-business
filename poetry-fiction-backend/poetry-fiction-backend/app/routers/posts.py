import math
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, get_current_admin
from app.models.post import Post, ContentType
from app.models.user import User
from app.schemas.post import PostCreate, PostUpdate, PostOut, PostSummary, PaginatedPosts

router = APIRouter(prefix="/posts", tags=["Publicaciones"])


def _normalize_tags(tags: str | None) -> str | None:
    if not tags:
        return None
    normalized = [t.strip() for t in tags.split(",") if t.strip()]
    return ",".join(normalized) if normalized else None


def _build_excerpt(content: str) -> str:
    preview = content.strip()
    if len(preview) <= 180:
        return preview
    return preview[:180].rstrip() + "..."


# ─── LISTAR (público) ─────────────────────────────────────────

@router.get(
    "",
    response_model=PaginatedPosts,
    summary="Listar publicaciones",
)
def list_posts(
    page: int = Query(1, ge=1, description="Número de página"),
    per_page: int = Query(
        12, ge=1, le=50, description="Resultados por página"),
    content_type: ContentType | None = Query(
        None, description="Filtrar por tipo: poema | cuento"),
    tag: str | None = Query(None, description="Filtrar por etiqueta"),
    search: str | None = Query(None, description="Buscar en título"),
    db: Session = Depends(get_db),
):
    """Lista publicaciones publicadas con paginación y filtros opcionales."""
    query = db.query(Post).filter(Post.is_published == True)

    if content_type:
        query = query.filter(Post.content_type == content_type)
    if tag:
        query = query.filter(Post.tags.contains(tag))
    if search:
        query = query.filter(
            or_(
                Post.title.ilike(f"%{search}%"),
                Post.content.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    pages = math.ceil(total / per_page) if total else 1
    items = (
        query
        .order_by(Post.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return PaginatedPosts(total=total, page=page, per_page=per_page, pages=pages, items=items)


@router.get(
    "/featured",
    response_model=list[PostSummary],
    summary="Publicaciones destacadas",
)
def list_featured_posts(
    limit: int = Query(6, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """Devuelve las publicaciones marcadas como destacadas."""
    return (
        db.query(Post)
        .filter(Post.is_published == True, Post.is_featured == True)
        .order_by(Post.created_at.desc())
        .limit(limit)
        .all()
    )


# ─── DETALLE (público) ────────────────────────────────────────

@router.get("/{post_id}", response_model=PostOut, summary="Ver publicación")
def get_post(post_id: int, db: Session = Depends(get_db)):
    """Devuelve el detalle completo de una publicación e incrementa las vistas."""
    post = db.query(Post).filter(Post.id == post_id,
                                 Post.is_published == True).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Publicación no encontrada")

    post.views += 1
    db.commit()
    db.refresh(post)
    return post


# ─── CREAR (requiere login) ───────────────────────────────────

@router.post(
    "",
    response_model=PostOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva publicación",
)
def create_post(
    payload: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crea un nuevo poema o cuento asociado al usuario autenticado."""
    payload_data = payload.model_dump()
    if not payload_data.get("excerpt") or not payload_data["excerpt"].strip():
        payload_data["excerpt"] = _build_excerpt(payload_data["content"])
    payload_data["tags"] = _normalize_tags(payload_data.get("tags"))

    post = Post(**payload_data, author_id=current_user.id)
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


# ─── EDITAR (solo el autor) ───────────────────────────────────

@router.put("/{post_id}", response_model=PostOut, summary="Editar publicación")
def update_post(
    post_id: int,
    payload: PostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Edita una publicación. Solo el autor puede modificarla."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Publicación no encontrada")
    if post.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="No tienes permiso para editar esta publicación")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(post, field, value)

    db.commit()
    db.refresh(post)
    return post


# ─── ELIMINAR (autor o admin) ─────────────────────────────────

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar publicación")
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Elimina una publicación. Solo el autor o un admin pueden hacerlo."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Publicación no encontrada")
    if post.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="No tienes permiso para eliminar esta publicación")

    db.delete(post)
    db.commit()
