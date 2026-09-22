from datetime import timedelta

from app.core.security import create_access_token


def registration_payload(email="reader@example.com"):
    return {
        "username": "reader_test",
        "full_name": "Reader Test",
        "email": email,
        "password": "SecurePass123!",
    }


def test_register_login_me_and_refresh(client):
    response = client.post("/api/v1/auth/register",
                           json=registration_payload())
    assert response.status_code == 201
    assert response.json()["access_token"]
    assert "pf_refresh_token" in response.cookies

    access_token = response.json()["access_token"]
    me = client.get("/api/v1/users/me",
                    headers={"Authorization": f"Bearer {access_token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "reader@example.com"

    refreshed = client.post("/api/v1/auth/refresh")
    assert refreshed.status_code == 200
    assert refreshed.json()["access_token"]
    assert refreshed.json()["access_token"] != access_token

    logout = client.post("/api/v1/auth/logout")
    assert logout.status_code == 204
    assert client.post("/api/v1/auth/refresh").status_code == 401


def test_invalid_registration_and_login(client):
    invalid = client.post("/api/v1/auth/register",
                          json={**registration_payload(), "password": "weak"})
    assert invalid.status_code == 422

    client.post("/api/v1/auth/register", json=registration_payload())
    invalid_login = client.post(
        "/api/v1/auth/login",
        json={"email": "reader@example.com", "password": "WrongPass123!"},
    )
    assert invalid_login.status_code == 401


def test_expired_access_token_and_admin_authorization(client):
    response = client.post("/api/v1/auth/register",
                           json=registration_payload())
    user_id = response.json()["user"]["id"]
    expired = create_access_token(
        {"sub": str(user_id)}, expires_delta=timedelta(seconds=-1)
    )
    assert client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {expired}"}).status_code == 401
    assert client.get("/api/v1/admin/stats", headers={
                      "Authorization": f"Bearer {response.json()['access_token']}"}).status_code == 403


def test_refresh_token_reuse_is_rejected(client):
    response = client.post("/api/v1/auth/register",
                           json=registration_payload())
    old_cookie = response.cookies.get("pf_refresh_token")
    client.post("/api/v1/auth/refresh")
    reused = client.post("/api/v1/auth/refresh",
                         cookies={"pf_refresh_token": old_cookie})
    assert reused.status_code == 401


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] in {"healthy", "degraded"}
