from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.posts import router as posts_router

__all__ = ["auth_router", "users_router", "posts_router"]
