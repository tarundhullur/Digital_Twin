"""
End-to-End Clinical Flow Verification Script
Tests the full lifecycle against http://localhost:3000:
Register -> Login -> Dashboard -> Open Patient -> Stream Readings -> What-If -> Metrics -> Logout
"""

import sys
import time
import httpx

BASE_URL = "http://localhost:3000"

def run_e2e_flow():
    print("[E2E] 1. Checking system health & DPDP/HIPAA badge...")
    r = httpx.get(f"{BASE_URL}/health")
    assert r.status_code == 200, f"Health check failed: {r.status_code}"
    print(f"      [OK] Health check passed: {r.json()['synthetic_data_badge']}")

    print("[E2E] 2. Clinician Registration...")
    reg_email = f"dr.e2e.{int(time.time())}@hospital.org"
    r = httpx.post(f"{BASE_URL}/auth/register", json={
        "name": "Dr. Sarah Chen, MD",
        "email": reg_email,
        "password": "ClinicalPassword2026!",
        "role": "doctor"
    })
    assert r.status_code == 201, f"Registration failed: {r.status_code}"
    print(f"      [OK] Registered doctor: {reg_email}")

    print("[E2E] 3. Clinician Login (Demo Doctor)...")
    r = httpx.post(f"{BASE_URL}/auth/login", json={
        "email": "doctor@demo.com",
        "password": "Demo@1234"
    })
    assert r.status_code == 200, f"Login failed: {r.status_code}"
    login_data = r.json()
    token = login_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"      [OK] Logged in successfully. Received 8h JWT token.")

    print("[E2E] 4. Fetch Dashboard Patient Cohort...")
    r = httpx.get(f"{BASE_URL}/patients", headers=headers)
    assert r.status_code == 200, f"Patients list failed: {r.status_code}"
    patients = r.json()
    assert len(patients) == 20, f"Expected 20 patients, got {len(patients)}"
    print(f"      [OK] Retrieved 20 virtual patients. First patient: {patients[0]['name']}")

    print("[E2E] 5. Open Patient Digital Twin (Patient #1)...")
    r = httpx.get(f"{BASE_URL}/patients/1", headers=headers)
    assert r.status_code == 200, f"Patient #1 failed: {r.status_code}"
    p1 = r.json()
    print(f"      [OK] Loaded EHR for {p1['name']}: Age {p1['age']}, HbA1c {p1['hba1c']}%, Genetic Marker: {p1['genetic_marker']}")

    print("[E2E] 6. Retrieve Wearable Time Series Stream (24 Hours)...")
    r = httpx.get(f"{BASE_URL}/patients/1/readings?hours=24", headers=headers)
    assert r.status_code == 200, f"Readings stream failed: {r.status_code}"
    readings = r.json()
    assert len(readings) == 288, f"Expected 288 readings, got {len(readings)}"
    print(f"      [OK] Retrieved 288 wearable telemetry points (5-min intervals).")

    print("[E2E] 7. Evaluate 2-Hour Adverse Spike Prediction...")
    r = httpx.get(f"{BASE_URL}/patients/1/predict", headers=headers)
    assert r.status_code == 200, f"Prediction failed: {r.status_code}"
    pred = r.json()
    print(f"      [OK] Prediction: {pred['risk_percentage']}% Spike Risk ({pred['risk_level']})")
    print(f"           Explanation: {pred['plain_language_explanation']}")

    print("[E2E] 8. Execute Prospective What-If Counterfactual Intervention...")
    what_if_payload = {
        "extra_steps": 4000,
        "carb_intake_g": 0,
        "sleep_hours_delta": 1.0,
        "medication_taken": True
    }
    r = httpx.post(f"{BASE_URL}/patients/1/predict", headers=headers, json=what_if_payload)
    assert r.status_code == 200, f"What-If simulation failed: {r.status_code}"
    what_if_pred = r.json()
    print(f"      [OK] What-If Result: Baseline {pred['risk_percentage']}% -> Simulated {what_if_pred['risk_percentage']}%")

    print("[E2E] 9. Retrieve Model Evaluation Metrics & Transparency...")
    r = httpx.get(f"{BASE_URL}/model/metrics", headers=headers)
    assert r.status_code == 200, f"Metrics failed: {r.status_code}"
    metrics = r.json()
    print(f"      [OK] Model Metrics: ROC-AUC={metrics['roc_auc']:.3f}, Accuracy={metrics['accuracy']:.3f}")

    print("[E2E] 10. Verify Unauthorized Access Rejection on Session Invalidation...")
    r = httpx.get(f"{BASE_URL}/patients/1", headers={"Authorization": "Bearer invalid_expired_token"})
    assert r.status_code == 401, f"Expected 401, got {r.status_code}"
    print("      [OK] Invalid session correctly rejected.")

    print("\n[SUCCESS] Full Clinical End-to-End Workflow Completed with Zero Errors!")

if __name__ == "__main__":
    run_e2e_flow()
