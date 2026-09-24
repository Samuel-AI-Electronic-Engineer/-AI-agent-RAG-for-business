from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app import database as database_module
from app.core.config import get_settings
from app.core.security import hash_password
from app.database import check_db_connection
from app.models.post import ContentType, Post
from app.models.product import Product
from app.models.user import User
from app.routers import auth_router, users_router, posts_router, admin_router, store_router, orders_router

settings = get_settings()
logger = logging.getLogger(__name__)


def create_dev_seed_data() -> None:
    """Crea datos de ejemplo en modo DEBUG si la base de datos está vacía."""
    if not settings.DEBUG:
        return

    with database_module.SessionLocal() as db:
        demo_user = db.query(User).filter(
            User.email.in_(["demo@poesia.com", "demo@poesia.local"])).first()
        if demo_user and demo_user.email == "demo@poesia.local":
            demo_user.email = "demo@poesia.com"
        if not demo_user:
            demo_user = User(
                username="poeta_demo",
                email="demo@poesia.com",
                hashed_password=hash_password("Demo12345!"),
                full_name="Poeta Demo",
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)

        sample_posts = [
            {
                "title": "Luz entre versos",
                "content": "La noche se abre en un susurro de palabras, y el viento escribe poemas en mi piel.",
                "excerpt": "La noche se abre en un susurro de palabras...",
                "content_type": ContentType.POEM,
                "cover_image_url": None,
                "tags": "noche,poema,susurro",
                "publication_status": "published",
                "is_published": True,
                "is_featured": True,
            },
            {
                "title": "El viaje del cuervo",
                "content": "Un cuervo viaja sobre campos de sueños rotos, buscando una historia que contar.",
                "excerpt": None,
                "content_type": ContentType.STORY,
                "cover_image_url": None,
                "tags": "misterio,viaje,sueños",
                "publication_status": "published",
                "is_published": True,
                "is_featured": False,
            },
            {
                "title": "Versos de lluvia",
                "content": "Cada gota que cae se convierte en verso, y la ciudad canta en clave de lluvia.",
                "excerpt": None,
                "content_type": ContentType.POEM,
                "cover_image_url": None,
                "tags": "lluvia,ciudad,poema",
                "publication_status": "published",
                "is_published": True,
                "is_featured": False,
            },
        ]

        if db.query(Post).count() == 0:
            for post_data in sample_posts:
                if not db.query(Post).filter(Post.title == post_data["title"]).first():
                    db.add(Post(author_id=demo_user.id, **post_data))

        sample_products = [
            {"title": "La luna entre la tinta", "author": "Poesía y Ficción", "description": "Una edición íntima de poemas sobre la noche, la memoria y todo lo que todavía nos nombra.",
                "price": 24.90, "format": "Edición impresa", "category": "Poesía", "accent": "gold", "stock": 12},
            {"title": "La ciudad del silencio", "author": "Marina Soler", "description": "Relatos breves para caminar por ciudades imaginarias y encontrar una voz en cada esquina.",
                "price": 19.50, "format": "Edición digital", "category": "Ficción", "accent": "rose", "stock": 30},
            {"title": "Constelaciones domésticas", "author": "Nicolás Vega", "description": "Ensayos mínimos sobre crear, leer y sostener una vida alrededor de los libros.",
                "price": 28.00, "format": "Edición de autor", "category": "Ensayo", "accent": "teal", "stock": 8},
        ]
        if db.query(Product).count() == 0:
            for product_data in sample_products:
                db.add(Product(**product_data))

        db.commit()
        print("✅ Datos de ejemplo creados para el modo DEBUG")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Acciones al iniciar y apagar la aplicación."""
    # ── Startup ──────────────────────────────────────────────
    print(f"\n🚀  Iniciando {settings.APP_NAME} v{settings.APP_VERSION}")

    if check_db_connection():
        print("✅  Conexión a la base de datos establecida")
        create_dev_seed_data()
    else:
        print("❌  No se pudo conectar a la base de datos — revisa tu .env")

    yield

    # ── Shutdown ─────────────────────────────────────────────
    print("👋  Servidor detenido correctamente")


# ─── APLICACIÓN ──────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "API REST para la plataforma de poesía y ficción. "
        "Permite publicar, leer y gestionar poemas y cuentos."
    ),
    docs_url="/docs",       # Swagger UI
    redoc_url="/redoc",     # ReDoc
    lifespan=lifespan,
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "error": {"code": "validation_error",
                                                   "message": "Los datos enviados no son válidos"}},
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException):
    code_by_status = {
        401: "authentication_required",
        403: "forbidden",
        404: "not_found",
        409: "conflict",
    }
    message = exc.detail if isinstance(
        exc.detail, str) else "La solicitud no pudo completarse"
    return JSONResponse(
        status_code=exc.status_code,
        headers=exc.headers,
        content={"detail": exc.detail, "error": {"code": code_by_status.get(
            exc.status_code, "http_error"), "message": message}},
    )


@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(_request: Request, exc: SQLAlchemyError):
    logger.exception("Database operation failed", exc_info=exc)
    return JSONResponse(
        status_code=503,
        content={"detail": "No fue posible completar la operación", "error": {
            "code": "database_unavailable", "message": "Servicio temporalmente no disponible"}},
    )


@app.exception_handler(Exception)
async def unexpected_exception_handler(_request: Request, exc: Exception):
    logger.exception("Unhandled application error", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Ocurrió un error interno", "error": {
            "code": "internal_error", "message": "No fue posible completar la operación"}},
    )

# ─── CORS ────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── RUTAS ───────────────────────────────────────────────────

API_PREFIX = "/api/v1"

app.include_router(auth_router,  prefix=API_PREFIX)
app.include_router(users_router, prefix=API_PREFIX)
app.include_router(posts_router, prefix=API_PREFIX)
app.include_router(admin_router, prefix=API_PREFIX)
app.include_router(store_router, prefix=API_PREFIX)
app.include_router(orders_router, prefix=API_PREFIX)


# ─── HEALTH CHECK ────────────────────────────────────────────

@app.get("/", tags=["Health"], summary="Estado del servidor")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"], summary="Health check detallado")
def health_check():
    db_ok = check_db_connection()
    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "app": settings.APP_NAME,
    }
