from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.security import hash_password
from app.database import Base, engine, check_db_connection, SessionLocal
from app.models.post import ContentType, Post
from app.models.user import User
from app.routers import auth_router, users_router, posts_router

settings = get_settings()


def create_dev_seed_data() -> None:
    """Crea datos de ejemplo en modo DEBUG si la base de datos está vacía."""
    if not settings.DEBUG:
        return

    with SessionLocal() as db:
        if db.query(Post).count() > 0:
            return

        demo_user = db.query(User).filter(
            User.email == "demo@poesia.local").first()
        if not demo_user:
            demo_user = User(
                username="poeta_demo",
                email="demo@poesia.local",
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
                "is_published": True,
                "is_featured": False,
            },
        ]

        for post_data in sample_posts:
            if not db.query(Post).filter(Post.title == post_data["title"]).first():
                db.add(Post(author_id=demo_user.id, **post_data))

        db.commit()
        print("✅ Datos de ejemplo creados para el modo DEBUG")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Acciones al iniciar y apagar la aplicación."""
    # ── Startup ──────────────────────────────────────────────
    print(f"\n🚀  Iniciando {settings.APP_NAME} v{settings.APP_VERSION}")

    if check_db_connection():
        print("✅  Conexión a la base de datos establecida")
        # Crea todas las tablas si no existen
        Base.metadata.create_all(bind=engine)
        print("✅  Tablas sincronizadas")
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
