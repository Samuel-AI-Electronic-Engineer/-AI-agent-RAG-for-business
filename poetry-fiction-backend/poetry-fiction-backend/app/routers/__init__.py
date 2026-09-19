from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.posts import router as posts_router
from app.routers.admin import router as admin_router
from app.routers.store import router as store_router
from app.routers.orders import router as orders_router

__all__ = ["auth_router", "users_router", "posts_router",
           "admin_router", "store_router", "orders_router"]
