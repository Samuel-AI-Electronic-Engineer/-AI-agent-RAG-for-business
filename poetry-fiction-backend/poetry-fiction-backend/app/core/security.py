from datetime import datetime, timedelta, timezone
import hashlib
import secrets
import uuid
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


# ─── CONTRASEÑAS ─────────────────────────────────────────────

def hash_password(plain_password: str) -> str:
    """Encripta una contraseña en texto plano."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si la contraseña coincide con el hash."""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except (ValueError, TypeError):
        return False


# ─── JWT TOKENS ───────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Genera un token JWT de acceso."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "typ": "access", "jti": uuid.uuid4().hex})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Decodifica y valida un token JWT. Retorna None si es inválido."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY,
                             algorithms=[settings.ALGORITHM])
        return payload if payload.get("typ") == "access" else None
    except JWTError:
        return None


def create_refresh_token() -> tuple[str, str, datetime]:
    """Genera el valor secreto del cookie y su hash persistible."""
    raw_token = secrets.token_urlsafe(64)
    expires_at = datetime.now(timezone.utc) + \
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return raw_token, hash_refresh_token(raw_token), expires_at


def hash_refresh_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
