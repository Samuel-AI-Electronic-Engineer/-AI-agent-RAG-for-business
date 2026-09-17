from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserMe, UserPublic, UserUpdate

router = APIRouter(prefix="/users", tags=["Usuarios"])


@router.get("/me", response_model=UserMe, summary="Mi perfil")
def get_my_profile(current_user: User = Depends(get_current_user)):
    """Devuelve los datos completos del usuario autenticado."""
    return current_user


@router.put("/me", response_model=UserMe, summary="Actualizar mi perfil")
def update_my_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Actualiza los datos del perfil del usuario autenticado."""
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get(
    "/{username}",
    response_model=UserPublic,
    summary="Perfil público de un usuario",
)
def get_user_by_username(username: str, db: Session = Depends(get_db)):
    """Devuelve el perfil público de cualquier usuario por su nombre."""
    user = db.query(User).filter(User.username == username, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario '{username}' no encontrado",
        )
    return user
