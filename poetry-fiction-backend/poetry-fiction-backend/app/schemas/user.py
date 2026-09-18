from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator


# ─── ENTRADA ─────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50,
                          pattern=r"^[a-zA-Z0-9_]+$", example="poetaurbano")
    email: EmailStr = Field(..., example="poeta@ejemplo.com")
    password: str = Field(..., min_length=8, max_length=128,
                          example="ContraseñaSegura123!")
    full_name: str | None = Field(None, max_length=100, example="María García")

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> EmailStr:
        return EmailStr(str(value).strip().lower())

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if not any(char.isupper() for char in value):
            raise ValueError("La contraseña debe incluir una letra mayúscula")
        if not any(char.islower() for char in value):
            raise ValueError("La contraseña debe incluir una letra minúscula")
        if not any(char.isdigit() for char in value):
            raise ValueError("La contraseña debe incluir un número")
        if not any(not char.isalnum() for char in value):
            raise ValueError("La contraseña debe incluir un símbolo")
        return value


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
    password: str = Field(..., min_length=1, max_length=128,
                          example="ContraseñaSegura123!")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> EmailStr:
        return EmailStr(str(value).strip().lower())


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserMe
