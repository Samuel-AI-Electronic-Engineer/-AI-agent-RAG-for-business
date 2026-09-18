r"""Promote an existing account to administrator.

Run from the backend application directory:
    ..\venv\Scripts\python.exe scripts\promote_admin.py user@example.com
"""

import sys
from pathlib import Path

from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import SessionLocal  # noqa: E402
from app.models.user import User  # noqa: E402


if len(sys.argv) != 2:
    raise SystemExit("Uso: python scripts/promote_admin.py correo@ejemplo.com")

email = sys.argv[1].strip().lower()

with SessionLocal() as db:
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        raise SystemExit(f"No existe un usuario con el correo {email}")

    user.is_admin = True
    db.commit()
    print(f"Administrador habilitado: {user.username} <{user.email}>")
