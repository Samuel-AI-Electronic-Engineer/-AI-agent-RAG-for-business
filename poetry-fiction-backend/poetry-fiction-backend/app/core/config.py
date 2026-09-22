from functools import lru_cache
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Poesía y Ficción"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: Literal["development",
                         "testing", "production"] = "development"
    DEBUG: bool = False

    DATABASE_URL: str | None = None
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "poetry_fiction_db"
    DB_USER: str = "postgres"
    DB_PASSWORD: str | None = None

    SECRET_KEY: str | None = None
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    REFRESH_COOKIE_NAME: str = "pf_refresh_token"
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"

    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://localhost:5500,http://127.0.0.1:5500"

    @property
    def database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        if not self.DB_PASSWORD:
            raise ValueError(
                "DB_PASSWORD es obligatoria cuando DATABASE_URL no está definida")
        return (
            f"postgresql+psycopg2://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    @model_validator(mode="after")
    def validate_security_settings(self):
        if not self.SECRET_KEY or len(self.SECRET_KEY) < 32:
            raise ValueError(
                "SECRET_KEY debe existir y tener al menos 32 caracteres")
        if self.ENVIRONMENT == "production":
            if self.DEBUG:
                raise ValueError("DEBUG debe ser false en producción")
            if not self.DATABASE_URL:
                raise ValueError("DATABASE_URL es obligatoria en producción")
            if not self.COOKIE_SECURE:
                raise ValueError("COOKIE_SECURE debe ser true en producción")
            if self.COOKIE_SAMESITE == "none" and not self.COOKIE_SECURE:
                raise ValueError("COOKIE_SAMESITE=none requiere COOKIE_SECURE=true")
            if any("localhost" in origin or "127.0.0.1" in origin for origin in self.origins_list):
                raise ValueError("ALLOWED_ORIGINS de producción no puede contener localhost")
        return self

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache()
def get_settings() -> Settings:
    return Settings()
