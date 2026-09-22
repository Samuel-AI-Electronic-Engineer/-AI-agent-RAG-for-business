from datetime import datetime, timezone

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.user import UserCreate, LoginRequest, TokenResponse, UserMe
from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Autenticación"])
settings = get_settings()


def _utc_datetime(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def _set_refresh_cookie(response: Response, raw_token: str) -> None:
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=raw_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/api/v1/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(settings.REFRESH_COOKIE_NAME, path="/api/v1/auth")


def _issue_session(user: User, db: Session, response: Response) -> TokenResponse:
    access_token = create_access_token({"sub": str(user.id)})
    raw_refresh, token_hash, expires_at = create_refresh_token()
    db.add(RefreshToken(user_id=user.id,
           token_hash=token_hash, expires_at=expires_at))
    db.commit()
    _set_refresh_cookie(response, raw_refresh)
    return TokenResponse(access_token=access_token, user=UserMe.model_validate(user))


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar nuevo usuario",
)
def register(payload: UserCreate, response: Response, db: Session = Depends(get_db)):
    """Crea una cuenta nueva y devuelve un token de acceso."""
    # Verificar que el email no esté en uso
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una cuenta con ese correo electrónico",
        )
    # Verificar que el username no esté en uso
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ese nombre de usuario ya está tomado",
        )

    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo o nombre de usuario ya está registrado",
        ) from None
    db.refresh(user)

    return _issue_session(user, db, response)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Iniciar sesión",
)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Autentica al usuario y devuelve un token JWT."""
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta está desactivada",
        )

    return _issue_session(user, db, response)


@router.post("/refresh", response_model=TokenResponse, summary="Renovar sesión")
def refresh_session(
    response: Response,
    db: Session = Depends(get_db),
    refresh_cookie: str | None = Cookie(
        default=None, alias=settings.REFRESH_COOKIE_NAME),
):
    if not refresh_cookie:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token requerido")

    stored_token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == hash_refresh_token(refresh_cookie)
    ).first()
    now = datetime.now(timezone.utc)
    expires_at = _utc_datetime(
        stored_token.expires_at) if stored_token else None
    if not stored_token or stored_token.revoked_at or expires_at <= now:
        if stored_token and not stored_token.revoked_at:
            stored_token.revoked_at = now
            db.commit()
        _clear_refresh_cookie(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Refresh token inválido o expirado")

    user = db.query(User).filter(
        User.id == stored_token.user_id, User.is_active == True).first()
    if not user:
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no disponible")

    stored_token.revoked_at = now
    result = _issue_session(user, db, response)
    db.refresh(stored_token)
    replacement = db.query(RefreshToken).filter(
        RefreshToken.user_id == user.id,
        RefreshToken.created_at >= now,
    ).order_by(RefreshToken.id.desc()).first()
    if replacement:
        stored_token.replaced_by = replacement.id
        db.commit()
    return result


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, summary="Cerrar sesión")
def logout(
    response: Response,
    db: Session = Depends(get_db),
    refresh_cookie: str | None = Cookie(
        default=None, alias=settings.REFRESH_COOKIE_NAME),
):
    if refresh_cookie:
        stored_token = db.query(RefreshToken).filter(
            RefreshToken.token_hash == hash_refresh_token(refresh_cookie),
            RefreshToken.revoked_at.is_(None),
        ).first()
        if stored_token:
            stored_token.revoked_at = datetime.now(timezone.utc)
            db.commit()
    _clear_refresh_cookie(response)
