"""
Phase 3 ML Model and Prediction Endpoints Test
Verifies time-based train/test split, GradientBoostingClassifier training,
metrics generation, feature explainability, and What-If counterfactual simulation.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.main import app
from app.db import init_db, seed_demo_doctor, DATA_DIR
from app.simulator import generate_and_seed_data
from app.ml import MODEL_PATH, METRICS_PATH, train_and_save_model, get_model_metrics


@pytest.fixture(scope="module", autouse=True)
def setup_all():
    """Ensure DB, synthetic data, and ML model exist."""
    init_db()
    seed_demo_doctor()
    generate_and_seed_data(force=False)
    if not MODEL_PATH.exists() or not METRICS_PATH.exists():
        train_and_save_model()


@pytest.fixture
def auth_client():
    """Returns a client with doctor authentication token."""
    with TestClient(app) as client:
        resp = client.post("/auth/login", json={"email": "doctor@demo.com", "password": "Demo@1234"})
        token = resp.json()["access_token"]
        client.headers.update({"Authorization": f"Bearer {token}"})
        yield client


def test_model_training_and_metrics():
    """Verify GradientBoostingClassifier metrics on out-of-time test split."""
    metrics = get_model_metrics()

    assert "accuracy" in metrics
    assert "roc_auc" in metrics
    assert "feature_importances" in metrics

    # Verify solid performance on synthetic physiological dataset
    assert metrics["accuracy"] >= 0.70, f"Accuracy too low: {metrics['accuracy']}"
    assert metrics["roc_auc"] >= 0.75, f"ROC-AUC too low: {metrics['roc_auc']}"
    assert metrics["train_samples"] > 0
    assert metrics["test_samples"] > 0

    # Verify key physiological features are in top importances
    top_features = list(metrics["feature_importances"].keys())[:5]
    assert any("glucose" in f or "hba1c" in f or "steps" in f for f in top_features)


def test_get_patients_list(auth_client):
    """Verify GET /patients returns 20 patients with latest_glucose and risk_level."""
    resp = auth_client.get("/patients")
    assert resp.status_code == 200
    patients = resp.json()
    assert len(patients) == 20
    first = patients[0]
    assert "name" in first
    assert "hba1c" in first
    assert "latest_glucose" in first
    assert first["latest_glucose"] is not None
    assert first["risk_level"] in ["Low", "Moderate", "High"]


def test_get_patient_detail(auth_client):
    """Verify GET /patients/{id} returns single patient EHR."""
    resp = auth_client.get("/patients/1")
    assert resp.status_code == 200
    p = resp.json()
    assert p["id"] == 1
    assert "age" in p
    assert "medications" in p
    assert "genetic_marker" in p


def test_get_patient_readings_time_series(auth_client):
    """Verify GET /patients/{id}/readings?hours=24 returns chronological time series."""
    resp = auth_client.get("/patients/1/readings?hours=24")
    assert resp.status_code == 200
    readings = resp.json()
    # 24 hours * 12 readings/hr = 288
    assert len(readings) == 288
    first = readings[0]
    last = readings[-1]
    assert first["timestamp"] < last["timestamp"], "Readings must be chronologically ascending"
    assert "glucose" in first
    assert "heart_rate" in first
    assert "hrv" in first
    assert "steps" in first


def test_predict_endpoint(auth_client):
    """Verify GET /patients/{id}/predict returns probability, risk level, features, and explanation."""
    resp = auth_client.get("/patients/1/predict")
    assert resp.status_code == 200
    pred = resp.json()

    assert "risk_probability" in pred
    assert 0.0 <= pred["risk_probability"] <= 1.0
    assert pred["risk_level"] in ["Low", "Moderate", "High"]
    assert len(pred["top_contributing_features"]) == 5
    assert len(pred["plain_language_explanation"]) > 20
    assert len(pred["clinical_recommendation"]) > 20

    # Validate feature attribution structure
    for feat in pred["top_contributing_features"]:
        assert "feature" in feat
        assert "display_name" in feat
        assert "importance" in feat
        assert feat["direction"] in ["increases_risk", "decreases_risk"]


def test_what_if_counterfactual_simulation(auth_client):
    """Verify POST /patients/{id}/predict modifies risk based on lifestyle and clinical interventions."""
    # Baseline prediction
    baseline_resp = auth_client.get("/patients/1/predict")
    baseline_prob = baseline_resp.json()["risk_probability"]

    # Scenario 1: Postprandial walk (+4,000 steps)
    walk_resp = auth_client.post(
        "/patients/1/predict",
        json={"extra_steps": 4000, "carb_intake_g": 0, "sleep_hours_delta": 0, "medication_taken": True},
    )
    assert walk_resp.status_code == 200
    walk_prob = walk_resp.json()["risk_probability"]
    assert walk_prob <= baseline_prob, "Extra physical activity should reduce or maintain risk"

    # Scenario 2: High carbohydrate load (+75g carbs)
    carb_resp = auth_client.post(
        "/patients/1/predict",
        json={"extra_steps": 0, "carb_intake_g": 75, "sleep_hours_delta": 0, "medication_taken": True},
    )
    assert carb_resp.status_code == 200
    carb_prob = carb_resp.json()["risk_probability"]
    assert carb_prob >= baseline_prob, "Carbohydrate ingestion should raise or maintain risk"


def test_get_model_metrics_endpoint(auth_client):
    """Verify GET /model/metrics returns full evaluation metrics."""
    resp = auth_client.get("/model/metrics")
    assert resp.status_code == 200
    data = resp.json()
    assert data["model_name"] == "GlucoTwin GradientBoostingClassifier"
    assert "accuracy" in data
    assert "precision" in data
    assert "recall" in data
    assert "roc_auc" in data
    assert len(data["feature_importances"]) > 10
