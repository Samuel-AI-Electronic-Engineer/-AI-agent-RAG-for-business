import math
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.post import Post, ContentType, PostPublicationStatus
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


def _sync_post_publication(post: Post, pub_status: PostPublicationStatus) -> None:
    """Actualiza el estado editorial del post y sincroniza is_published."""
    post.publication_status = pub_status
    post.sync_publication_status()


# ─── LISTAR (público) ─────────────────────────────────────────

@router.get(
    "",
    response_model=PaginatedPosts,
    summary="Listar publicaciones",
)
def list_posts(
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=50),
    content_type: ContentType | None = Query(None),
    tags: str | None = Query(None),
    search: str | None = Query(
        None, min_length=1, max_length=200, description="Búsqueda por título"),
    author: str | None = Query(
        None, min_length=1, max_length=100, description="Búsqueda por autor (usuario o nombre)"),
    sort: Literal["recent", "popular"] = Query(
        "recent", description="Orden de los resultados"),
    db: Session = Depends(get_db),
):
    """Devuelve un listado paginado de publicaciones visibles (estado PUBLISHED)."""
    query = db.query(Post).filter(Post.publication_status ==
                                  PostPublicationStatus.PUBLISHED)

    if content_type:
        query = query.filter(Post.content_type == content_type)

    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        for tag in tag_list:
            query = query.filter(Post.tags.like(f"%{tag}%"))

    if search:
        query = query.filter(Post.title.ilike(f"%{search.strip()}%"))

    if author:
        author_term = f"%{author.strip()}%"
        query = query.join(User, Post.author_id == User.id).filter(
            or_(User.username.ilike(author_term),
                User.full_name.ilike(author_term))
        )

    total = query.count()
    pages = math.ceil(total / per_page) if total else 1
    order_column = Post.views.desc() if sort == "popular" else Post.created_at.desc()
    items = (
        query.order_by(order_column)
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
        .filter(Post.publication_status == PostPublicationStatus.PUBLISHED, Post.is_featured == True)
        .order_by(Post.created_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/stats", summary="Estadísticas públicas")
def post_stats(db: Session = Depends(get_db)):
    """Devuelve estadísticas calculadas sobre publicaciones visibles."""
    published = Post.publication_status == PostPublicationStatus.PUBLISHED
    counts = db.query(
        Post.content_type,
        func.count(Post.id),
    ).filter(published).group_by(Post.content_type).all()
    by_type = {content_type.value: count for content_type, count in counts}

    return {
        "poems": by_type.get(ContentType.POEM.value, 0),
        "stories": by_type.get(ContentType.STORY.value, 0),
        "authors": db.query(func.count(func.distinct(Post.author_id))).filter(published).scalar() or 0,
    }


# ─── DASHBOARD DEL AUTOR ──────────────────────────────────────

@router.get(
    "/mine",
    response_model=PaginatedPosts,
    summary="Mis publicaciones",
)
def list_my_posts(
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=50),
    publication_status: PostPublicationStatus | None = Query(
        None, description="Filtrar por estado editorial"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Devuelve el panel del autor con su propio conjunto de publicaciones."""
    query = db.query(Post).filter(Post.author_id == current_user.id)
    if publication_status:
        query = query.filter(Post.publication_status == publication_status)

    total = query.count()
    pages = math.ceil(total / per_page) if total else 1
    items = (
        query.order_by(Post.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return PaginatedPosts(total=total, page=page, per_page=per_page, pages=pages, items=items)


@router.get(
    "/mine/{post_id}",
    response_model=PostOut,
    summary="Detalle propio de publicación (cualquier estado editorial)",
)
def get_my_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Devuelve el detalle completo de una publicación propia para edición, sin importar su estado."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Publicación no encontrada")
    if post.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="No tienes permiso para ver esta publicación")
    return post


# ─── DETALLE (público) ────────────────────────────────────────

@router.get("/{post_id}", response_model=PostOut, summary="Ver publicación")
def get_post(post_id: int, db: Session = Depends(get_db)):
    """Devuelve el detalle completo de una publicación e incrementa las vistas."""
    post = db.query(Post).filter(Post.id == post_id,
                                 Post.publication_status == PostPublicationStatus.PUBLISHED).first()
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
    payload_data.pop("is_published", None)
    if not payload_data.get("excerpt") or not payload_data["excerpt"].strip():
        payload_data["excerpt"] = _build_excerpt(payload_data["content"])
    payload_data["tags"] = _normalize_tags(payload_data.get("tags"))

    status_value = payload.publication_status or PostPublicationStatus.DRAFT
    if status_value != PostPublicationStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las publicaciones nuevas se crean como borrador",
        )

    payload_data["publication_status"] = PostPublicationStatus.DRAFT
    payload_data["is_published"] = False

    post = Post(**payload_data, author_id=current_user.id)
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.patch("/{post_id}/submit-review", response_model=PostOut, summary="Enviar a revisión")
def submit_for_review(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Permite que el autor envíe una obra al editor."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Publicación no encontrada")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Solo el autor puede enviar esta publicación")

    if post.publication_status not in {PostPublicationStatus.DRAFT, PostPublicationStatus.REJECTED}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La publicación solo puede enviarse a revisión desde borrador o rechazado",
        )

    _sync_post_publication(post, PostPublicationStatus.PENDING_REVIEW)
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

    if not current_user.is_admin and post.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="No tienes permiso para editar esta publicación")

    if post.publication_status in {PostPublicationStatus.PENDING_REVIEW, PostPublicationStatus.PUBLISHED}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La publicación ya está en flujo editorial activo; usa la revisión o moderación adecuada",
        )

    update_data = payload.model_dump(exclude_unset=True)
    requested_status = update_data.pop("publication_status", None)
    if requested_status is not None:
        requested_status = PostPublicationStatus(requested_status)
        if not current_user.is_admin and requested_status != PostPublicationStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo un administrador puede cambiar el estado editorial fuera de borrador",
            )
        if not current_user.is_admin and post.publication_status not in {PostPublicationStatus.DRAFT, PostPublicationStatus.REJECTED}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La publicación no puede volver a borrador en este estado",
            )
        _sync_post_publication(post, requested_status)

    if "is_published" in update_data:
        update_data.pop("is_published")
    for field, value in update_data.items():
        setattr(post, field, value)

    post.sync_publication_status()

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
