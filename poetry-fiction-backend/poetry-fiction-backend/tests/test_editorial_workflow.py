from app.models.post import PostPublicationStatus


def test_author_creates_draft_and_sees_own_posts(client):
    author = client.post(
        "/api/v1/auth/register",
        json={
            "username": "author_one",
            "full_name": "Author One",
            "email": "author1@example.com",
            "password": "SecurePass123!",
        },
    )
    token = author.json()["access_token"]

    created = client.post(
        "/api/v1/posts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Poema del amanecer",
            "content": "La mañana abre sus manos sobre el río y yo escucho la ciudad respirar.",
            "content_type": "poema",
            "tags": "amanecer,ciudad",
        },
    )

    assert created.status_code == 201
    assert created.json()[
        "publication_status"] == PostPublicationStatus.DRAFT.value
    assert created.json()["is_published"] is False

    mine = client.get(
        "/api/v1/posts/mine",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert mine.status_code == 200
    assert mine.json()["total"] == 1
    assert mine.json()[
        "items"][0]["publication_status"] == PostPublicationStatus.DRAFT.value


def test_author_can_submit_for_review_and_admin_can_publish_or_reject(client):
    # Get bootstrap admin token
    admin_login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "bootstrap_admin@test.example.com",
            "password": "Bootstrap@123",
        },
    )
    admin_token = admin_login.json()["access_token"]

    # Register author
    author = client.post(
        "/api/v1/auth/register",
        json={
            "username": "author_two",
            "full_name": "Author Two",
            "email": "author2@example.com",
            "password": "SecurePass123!",
        },
    )
    author_token = author.json()["access_token"]

    # Author creates post
    created = client.post(
        "/api/v1/posts",
        headers={"Authorization": f"Bearer {author_token}"},
        json={
            "title": "Cuento de niebla",
            "content": "La niebla cubrió la estación y cada ventana guardaba un recuerdo sin nombre.",
            "content_type": "cuento",
        },
    )
    post_id = created.json()["id"]

    # Author submits for review
    submitted = client.patch(
        f"/api/v1/posts/{post_id}/submit-review",
        headers={"Authorization": f"Bearer {author_token}"},
    )
    assert submitted.status_code == 200
    assert submitted.json()[
        "publication_status"] == PostPublicationStatus.PENDING_REVIEW.value

    # Admin publishes
    published = client.patch(
        f"/api/v1/admin/posts/{post_id}/publication",
        params={"pub_status": PostPublicationStatus.PUBLISHED.value},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert published.status_code == 200
    assert published.json()[
        "publication_status"] == PostPublicationStatus.PUBLISHED.value
    assert published.json()["is_published"] is True

    # Test rejection with a new post in PENDING_REVIEW state
    created2 = client.post(
        "/api/v1/posts",
        headers={"Authorization": f"Bearer {author_token}"},
        json={
            "title": "Otro cuento",
            "content": "Contenido del segundo cuento.",
            "content_type": "cuento",
        },
    )
    post_id_2 = created2.json()["id"]

    # Author submits second post for review
    client.patch(
        f"/api/v1/posts/{post_id_2}/submit-review",
        headers={"Authorization": f"Bearer {author_token}"},
    )

    # Admin rejects second post from PENDING_REVIEW
    rejected = client.patch(
        f"/api/v1/admin/posts/{post_id_2}/publication",
        params={"pub_status": PostPublicationStatus.REJECTED.value},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert rejected.status_code == 200
    assert rejected.json()[
        "publication_status"] == PostPublicationStatus.REJECTED.value

    # Author cannot moderate
    author_attempt = client.patch(
        f"/api/v1/admin/posts/{post_id}/publication",
        params={"pub_status": PostPublicationStatus.DRAFT.value},
        headers={"Authorization": f"Bearer {author_token}"},
    )
    assert author_attempt.status_code == 403


def test_admin_can_retire_published_post_back_to_draft(client):
    # Get bootstrap admin token
    admin_login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "bootstrap_admin@test.example.com",
            "password": "Bootstrap@123",
        },
    )
    admin_token = admin_login.json()["access_token"]

    # Register author
    author = client.post(
        "/api/v1/auth/register",
        json={
            "username": "author_three",
            "full_name": "Author Three",
            "email": "author3@example.com",
            "password": "SecurePass123!",
        },
    )
    author_token = author.json()["access_token"]

    # Author creates post
    created = client.post(
        "/api/v1/posts",
        headers={"Authorization": f"Bearer {author_token}"},
        json={
            "title": "Poema retirado",
            "content": "La página sigue esperando la lluvia de la noche más oscura.",
            "content_type": "poema",
        },
    )
    post_id = created.json()["id"]

    # Author submits for review
    client.patch(
        f"/api/v1/posts/{post_id}/submit-review",
        headers={"Authorization": f"Bearer {author_token}"},
    )

    # Admin publishes
    client.patch(
        f"/api/v1/admin/posts/{post_id}/publication",
        params={"pub_status": PostPublicationStatus.PUBLISHED.value},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # Admin retires back to draft
    retired = client.patch(
        f"/api/v1/admin/posts/{post_id}/publication",
        params={"pub_status": PostPublicationStatus.DRAFT.value},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert retired.status_code == 200
    assert retired.json()[
        "publication_status"] == PostPublicationStatus.DRAFT.value
    assert retired.json()["is_published"] is False
