import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.core.security import hash_password
import os

os.environ.setdefault("ENVIRONMENT", "testing")
os.environ.setdefault(
    "SECRET_KEY", "test-secret-key-with-more-than-32-characters")
os.environ.setdefault("DB_PASSWORD", "test")
os.environ.setdefault("DATABASE_URL", "sqlite://")


@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    from app import database as app_database
    app_database.engine = engine
    app_database.SessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=engine
    )

    TestingSession = sessionmaker(
        autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    # Create bootstrap admin user for testing purposes
    bootstrap_db = TestingSession()
    bootstrap_admin = User(
        username="bootstrap_admin",
        email="bootstrap_admin@test.example.com",
        hashed_password=hash_password("Bootstrap@123"),
        full_name="Bootstrap Admin",
        is_admin=True,
        is_active=True,
    )
    bootstrap_db.add(bootstrap_admin)
    bootstrap_db.commit()
    bootstrap_db.close()

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
