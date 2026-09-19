import math

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_admin
from app.models.post import Post
from app.models.user import User
from app.schemas.post import PostOut
from app.schemas.user import AdminUserUpdate, UserMe

router = APIRouter(prefix="/admin", tags=["Administración"])


@router.get("/users", response_model=list[UserMe], summary="Listar usuarios")
def list_users(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Devuelve todos los usuarios para el panel de administración."""
    return db.query(User).order_by(User.created_at.desc()).all()


@router.patch("/users/{user_id}", response_model=UserMe, summary="Actualizar permisos de usuario")
def update_user_permissions(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Activa, desactiva o cambia el rol administrativo de un usuario."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    if user.id == current_admin.id and (payload.is_active is False or payload.is_admin is False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes desactivar tu cuenta ni quitarte el rol de administrador",
        )

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.get("/posts", summary="Listar publicaciones administrativas")
def list_admin_posts(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Lista publicaciones publicadas y no publicadas, incluyendo su autor."""
    query = db.query(Post).options(joinedload(Post.author)
                                   ).order_by(Post.created_at.desc())
    total = query.count()
    pages = math.ceil(total / per_page) if total else 1
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return {"total": total, "page": page, "per_page": per_page, "pages": pages, "items": items}


@router.get("/stats", summary="Estadísticas administrativas")
def admin_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Calcula métricas operativas a partir de los datos persistidos."""
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    admin_users = db.query(User).filter(User.is_admin == True).count()
    total_posts = db.query(Post).count()
    published_posts = db.query(Post).filter(Post.is_published == True).count()
    pending_posts = db.query(Post).filter(Post.is_published == False).count()
    total_views = sum((row[0] or 0) for row in db.query(Post.views).all())

    return {
        "users": {"total": total_users, "active": active_users, "admins": admin_users},
        "posts": {
            "total": total_posts,
            "published": published_posts,
            "pending": pending_posts,
            "views": total_views,
        },
    }


@router.get("/moderation", response_model=list[PostOut], summary="Listar publicaciones pendientes")
def moderation_queue(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Devuelve la cola editorial formada por publicaciones no publicadas."""
    return (
        db.query(Post)
        .options(joinedload(Post.author))
        .filter(Post.is_published == False)
        .order_by(Post.created_at.asc())
        .all()
    )


@router.patch("/posts/{post_id}/publication", response_model=PostOut, summary="Moderar publicación")
def moderate_post(
    post_id: int,
    is_published: bool = Query(...,
                               description="Publicar o retirar la publicación"),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Publica o retira una obra desde la cola de moderación."""
    post = db.query(Post).options(joinedload(Post.author)
                                  ).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Publicación no encontrada")

    post.is_published = is_published
    db.commit()
    db.refresh(post)
    return post
