from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# ─── ENTRADA ─────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, example="poetaurbano")
    email: EmailStr = Field(..., example="poeta@ejemplo.com")
    password: str = Field(..., min_length=8, example="contraseñaSegura123")
    full_name: str | None = Field(None, max_length=100, example="María García")


class UserUpdate(BaseModel):
    full_name: str | None = Field(None, max_length=100)
    bio: str | None = Field(None, max_length=500)
    avatar_url: str | None = Field(None, max_length=500)


# ─── SALIDA ───────────────────────────────────────────────────

class UserPublic(BaseModel):
    """Datos del usuario visibles para todos."""
    id: int
    username: str
    full_name: str | None
    bio: str | None
    avatar_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserMe(UserPublic):
    """Datos del usuario autenticado (incluye email)."""
    email: str
    is_active: bool
    is_admin: bool


# ─── AUTH ────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr = Field(..., example="poeta@ejemplo.com")
    password: str = Field(..., example="contraseñaSegura123")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserMe
