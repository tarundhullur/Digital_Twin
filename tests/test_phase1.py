"""
Phase 1 Foundation Test
Verifies SQLite tables, auth endpoints (register, login, me), and demo doctor credentials.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Add backend to PYTHONPATH
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.main import app
from app.db import get_db, init_db, seed_demo_doctor


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Ensure DB and demo doctor are initialized before testing."""
    init_db()
    seed_demo_doctor()


@pytest.fixture
def client():
    """Create a FastAPI test client with lifespan triggered."""
    with TestClient(app) as test_client:
        yield test_client


def test_sqlite_tables_exist():
    """Verify users, patients, and readings tables exist in SQLite."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row["name"] for row in cursor.fetchall()]
        assert "users" in tables, "Table 'users' missing in SQLite"
        assert "patients" in tables, "Table 'patients' missing in SQLite"
        assert "readings" in tables, "Table 'readings' missing in SQLite"


def test_demo_doctor_login_success(client):
    """Verify demo doctor (doctor@demo.com / Demo@1234) can login and get 8h JWT."""
    response = client.post(
        "/auth/login",
        json={"email": "doctor@demo.com", "password": "Demo@1234"},
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in_hours"] == 8
    assert data["user"]["email"] == "doctor@demo.com"
    assert data["user"]["role"] == "doctor"


def test_auth_me_with_valid_token(client):
    """Verify GET /auth/me returns user profile when authenticated."""
    # First login
    login_resp = client.post(
        "/auth/login",
        json={"email": "doctor@demo.com", "password": "Demo@1234"},
    )
    token = login_resp.json()["access_token"]

    # Call /auth/me
    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    user_info = response.json()
    assert user_info["email"] == "doctor@demo.com"
    assert user_info["name"] == "Dr. Sarah Chen, MD"


def test_auth_me_unauthorized(client):
    """Verify GET /auth/me rejects missing or invalid token."""
    response = client.get("/auth/me")
    assert response.status_code == 401

    response_invalid = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer invalid.token.signature"},
    )
    assert response_invalid.status_code == 401


def test_register_new_user(client):
    """Verify POST /auth/register creates a new user and denies duplicate emails."""
    import time
    test_email = f"marcus.vance.{int(time.time())}@hospital.org"
    new_user = {
        "name": "Dr. Marcus Vance",
        "email": test_email,
        "password": "SecurePassword123!",
        "role": "doctor",
    }
    response = client.post("/auth/register", json=new_user)
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["email"] == new_user["email"]
    assert "access_token" in data

    # Attempt duplicate registration
    dup_response = client.post("/auth/register", json=new_user)
    assert dup_response.status_code == 409
