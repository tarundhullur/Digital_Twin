"""
GlucoTwin Comprehensive End-to-End Test Suite
Tests authentication, patient EHR, wearable readings time-series,
ML spike predictions, what-if counterfactual simulations, and model metrics.
"""

import sys
import time
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.main import app
from app.db import init_db, seed_demo_doctor, get_db
from app.simulator import generate_and_seed_data
from app.ml import MODEL_PATH, METRICS_PATH, train_and_save_model


@pytest.fixture(scope="module", autouse=True)
def setup_test_environment():
    """Ensure database, synthetic data, and ML models are initialized."""
    init_db()
    seed_demo_doctor()
    generate_and_seed_data(force=False)
    if not MODEL_PATH.exists() or not METRICS_PATH.exists():
        train_and_save_model()


@pytest.fixture
def client():
    """FastAPI TestClient instance with lifespan triggered."""
    with TestClient(app) as test_client:
        yield test_client


# ==========================================
# 1. AUTHENTICATION & SECURITY TESTS
# ==========================================

def test_auth_login_demo_doctor(client):
    """Doctor login with valid credentials returns 8h JWT and user profile."""
    resp = client.post(
        "/auth/login",
        json={"email": "doctor@demo.com", "password": "Demo@1234"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in_hours"] == 8
    assert data["user"]["email"] == "doctor@demo.com"
    assert data["user"]["role"] == "doctor"


def test_auth_login_invalid_password(client):
    """Login with wrong password returns 401 Unauthorized."""
    resp = client.post(
        "/auth/login",
        json={"email": "doctor@demo.com", "password": "WrongPassword"},
    )
    assert resp.status_code == 401
    assert "Invalid email or password" in resp.json()["detail"]


def test_auth_register_and_login_flow(client):
    """New clinician registration succeeds and receives authorization."""
    unique_email = f"clinician.{int(time.time() * 1000)}@hospital.org"
    reg_payload = {
        "name": "Dr. Alex Rivera, MD",
        "email": unique_email,
        "password": "ClinicalPassword2026!",
        "role": "doctor",
    }
    reg_resp = client.post("/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    assert reg_data["user"]["email"] == unique_email
    assert "access_token" in reg_data

    # Log in with the newly created account
    login_resp = client.post(
        "/auth/login",
        json={"email": unique_email, "password": "ClinicalPassword2026!"},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    # Verify /auth/me with Bearer token
    me_resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == unique_email
    assert me_resp.json()["name"] == "Dr. Alex Rivera, MD"


def test_auth_me_unauthorized_rejection(client):
    """Accessing /auth/me without valid token returns 401."""
    resp = client.get("/auth/me")
    assert resp.status_code == 401


# ==========================================
# 2. PATIENTS & TIME-SERIES ENDPOINTS
# ==========================================

def get_auth_headers(client):
    resp = client.post(
        "/auth/login",
        json={"email": "doctor@demo.com", "password": "Demo@1234"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_get_all_patients_cohort(client):
    """GET /patients returns all 20 virtual patients with glucose and risk level."""
    headers = get_auth_headers(client)
    resp = client.get("/patients", headers=headers)
    assert resp.status_code == 200
    patients = resp.json()
    assert len(patients) == 20

    for p in patients:
        assert p["id"] >= 1
        assert len(p["name"]) > 2
        assert 18 <= p["age"] <= 100
        assert p["sex"] in ["M", "F"]
        assert p["bmi"] >= 18.0
        assert p["hba1c"] >= 5.0
        assert p["latest_glucose"] is not None
        assert p["risk_level"] in ["Low", "Moderate", "High"]


def test_get_single_patient_ehr(client):
    """GET /patients/{id} returns detailed static EHR data."""
    headers = get_auth_headers(client)
    resp = client.get("/patients/1", headers=headers)
    assert resp.status_code == 200
    p = resp.json()
    assert p["id"] == 1
    assert "medications" in p
    assert "genetic_marker" in p
    assert "diagnosis_years" in p
    assert "family_history_flag" in p


def test_get_patient_readings_stream(client):
    """GET /patients/{id}/readings?hours=24 returns 288 chronological 5-min readings."""
    headers = get_auth_headers(client)
    resp = client.get("/patients/1/readings?hours=24", headers=headers)
    assert resp.status_code == 200
    readings = resp.json()
    assert len(readings) == 288  # 24 * 12
    # Ascending order
    assert readings[0]["timestamp"] < readings[-1]["timestamp"]
    for r in readings[:10]:
        assert 50.0 <= r["glucose"] <= 350.0
        assert 40.0 <= r["heart_rate"] <= 180.0
        assert 10.0 <= r["hrv"] <= 120.0
        assert r["sleep_stage"] in ["awake", "light", "deep", "rem"]
        assert r["steps"] >= 0


# ==========================================
# 3. PREDICTIONS, WHAT-IF, & MODEL METRICS
# ==========================================

def test_adverse_spike_prediction(client):
    """GET /patients/{id}/predict returns 2-hour spike probability & clinical explanation."""
    headers = get_auth_headers(client)
    resp = client.get("/patients/1/predict", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["patient_id"] == 1
    assert "current_glucose" in data
    assert 0.0 <= data["risk_probability"] <= 1.0
    assert data["risk_level"] in ["Low", "Moderate", "High"]
    assert len(data["top_contributing_features"]) == 5
    assert len(data["plain_language_explanation"]) > 20
    assert len(data["clinical_recommendation"]) > 20

    # Ensure feature direction attribution is defined
    for feat in data["top_contributing_features"]:
        assert feat["direction"] in ["increases_risk", "decreases_risk"]


def test_what_if_exercise_mitigates_risk(client):
    """POST /patients/{id}/predict: Extra physical activity reduces or maintains predicted risk."""
    headers = get_auth_headers(client)
    # Baseline
    base_resp = client.get("/patients/2/predict", headers=headers)
    base_risk = base_resp.json()["risk_probability"]

    # Prospective 5,000 steps walk
    walk_resp = client.post(
        "/patients/2/predict",
        headers=headers,
        json={"extra_steps": 5000, "carb_intake_g": 0, "sleep_hours_delta": 0, "medication_taken": True},
    )
    assert walk_resp.status_code == 200
    walk_risk = walk_resp.json()["risk_probability"]
    assert walk_risk <= base_risk, f"Walking risk ({walk_risk}) should be <= baseline ({base_risk})"


def test_what_if_carbs_increase_risk(client):
    """POST /patients/{id}/predict: Carbohydrate ingestion increases or maintains predicted risk."""
    headers = get_auth_headers(client)
    base_resp = client.get("/patients/2/predict", headers=headers)
    base_risk = base_resp.json()["risk_probability"]

    # Prospective 80g carb meal
    carb_resp = client.post(
        "/patients/2/predict",
        headers=headers,
        json={"extra_steps": 0, "carb_intake_g": 80, "sleep_hours_delta": 0, "medication_taken": True},
    )
    assert carb_resp.status_code == 200
    carb_risk = carb_resp.json()["risk_probability"]
    assert carb_risk >= base_risk, f"Carb risk ({carb_risk}) should be >= baseline ({base_risk})"


def test_model_metrics_transparency(client):
    """GET /model/metrics returns ROC-AUC, accuracy, sample counts, and feature importances."""
    headers = get_auth_headers(client)
    resp = client.get("/model/metrics", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["model_name"] == "GlucoTwin GradientBoostingClassifier"
    assert data["accuracy"] >= 0.70
    assert data["roc_auc"] >= 0.75
    assert data["train_samples"] > 0
    assert data["test_samples"] > 0
    assert len(data["feature_importances"]) >= 15


def test_compliance_and_health(client):
    """Health check confirms DPDP/HIPAA synthetic safety badge."""
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "Synthetic data only – DPDP/HIPAA safe" in data["synthetic_data_badge"]
