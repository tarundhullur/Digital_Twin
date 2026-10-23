"""
GlucoTwin Machine Learning Module
Digital Twin prediction engine for Type 2 Diabetes.
Fuses static EHR with dynamic wearable time-series to predict
glucose spike (> 180 mg/dL) within the next 2 hours.
Includes time-based train/test split, GradientBoostingClassifier,
feature importance attribution, plain-language explanations, and what-if simulation.
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
)

from app.db import get_db, DATA_DIR

MODEL_PATH = DATA_DIR / "glucotwin_model.joblib"
METRICS_PATH = DATA_DIR / "metrics.json"

FEATURE_NAMES = [
    "glucose_last",
    "glucose_mean_2h",
    "glucose_std_2h",
    "glucose_min_2h",
    "glucose_max_2h",
    "glucose_slope_2h",
    "hr_mean_2h",
    "hr_last",
    "hrv_mean_2h",
    "hrv_last",
    "sleep_quality_score",
    "steps_sum_2h",
    "age",
    "bmi",
    "hba1c",
    "diagnosis_years",
    "family_history_flag",
    "genetic_risk_score",
]

FEATURE_LABELS = {
    "glucose_last": "Current Glucose (mg/dL)",
    "glucose_mean_2h": "2-Hour Mean Glucose",
    "glucose_std_2h": "Glycemic Variability (Std Dev)",
    "glucose_min_2h": "2-Hour Minimum Glucose",
    "glucose_max_2h": "2-Hour Maximum Glucose",
    "glucose_slope_2h": "Glucose Velocity (Rate of Rise)",
    "hr_mean_2h": "2-Hour Mean Heart Rate",
    "hr_last": "Current Heart Rate (bpm)",
    "hrv_mean_2h": "2-Hour Autonomic HRV (ms)",
    "hrv_last": "Current HRV (ms)",
    "sleep_quality_score": "Overnight Sleep Quality Score",
    "steps_sum_2h": "Physical Activity (Steps past 2h)",
    "age": "Patient Age",
    "bmi": "Body Mass Index (BMI)",
    "hba1c": "Glycated Hemoglobin (HbA1c %)",
    "diagnosis_years": "T2D Diagnosis Duration (Years)",
    "family_history_flag": "Family History of Diabetes",
    "genetic_risk_score": "Genetic Risk Allele Burden",
}


def encode_genetic_marker(marker_str: str) -> float:
    """Encodes clinical genetic marker text into numeric risk burden."""
    if not marker_str:
        return 0.0
    m = marker_str.upper()
    if "TT" in m or "HIGH RISK" in m:
        return 1.0
    elif "CT" in m or "MOD" in m or "VARIANT" in m or "PRO12ALA" in m or "E23K" in m:
        return 0.5
    return 0.0


def calculate_sleep_quality(readings_window: List[Dict]) -> float:
    """Computes a sleep score (0-100) based on deep/rem sleep distribution."""
    sleep_readings = [r for r in readings_window if r.get("sleep_stage") in ["light", "deep", "rem"]]
    if not sleep_readings:
        return 72.0  # Default daytime baseline

    total_sleep = len(sleep_readings)
    deep_rem = sum(1 for r in sleep_readings if r.get("sleep_stage") in ["deep", "rem"])
    ratio = deep_rem / max(total_sleep, 1)
    # Ideal restorative sleep is ~35-50% deep+rem
    score = min(100.0, max(20.0, ratio * 180.0))
    return round(float(score), 1)


def extract_features_from_window(
    window_readings: List[Dict],
    patient_ehr: Dict,
) -> np.ndarray:
    """
    Extracts the 18 fused features from the past 2-hour window and static EHR.
    window_readings is assumed ordered chronologically (up to 24 readings).
    """
    if not window_readings:
        # Fallback if no readings
        base_g = 28.7 * patient_ehr["hba1c"] - 46.7
        g_vals = [base_g]
        hr_vals = [72.0]
        hrv_vals = [35.0]
        step_vals = [50]
    else:
        g_vals = [float(r["glucose"]) for r in window_readings]
        hr_vals = [float(r["heart_rate"]) for r in window_readings]
        hrv_vals = [float(r["hrv"]) for r in window_readings]
        step_vals = [int(r["steps"]) for r in window_readings]

    glucose_last = g_vals[-1]
    glucose_mean_2h = float(np.mean(g_vals))
    glucose_std_2h = float(np.std(g_vals)) if len(g_vals) > 1 else 0.0
    glucose_min_2h = float(np.min(g_vals))
    glucose_max_2h = float(np.max(g_vals))

    # Slope: change per hour over available window
    if len(g_vals) >= 2:
        hours_elapsed = (len(g_vals) * 5.0) / 60.0
        glucose_slope_2h = float((g_vals[-1] - g_vals[0]) / max(hours_elapsed, 0.1))
    else:
        glucose_slope_2h = 0.0

    hr_mean_2h = float(np.mean(hr_vals))
    hr_last = hr_vals[-1]
    hrv_mean_2h = float(np.mean(hrv_vals))
    hrv_last = hrv_vals[-1]
    sleep_quality_score = calculate_sleep_quality(window_readings)
    steps_sum_2h = float(np.sum(step_vals))

    age = float(patient_ehr["age"])
    bmi = float(patient_ehr["bmi"])
    hba1c = float(patient_ehr["hba1c"])
    diagnosis_years = float(patient_ehr["diagnosis_years"])
    family_history_flag = float(patient_ehr["family_history_flag"])
    genetic_risk_score = encode_genetic_marker(patient_ehr["genetic_marker"])

    features = [
        glucose_last,
        glucose_mean_2h,
        glucose_std_2h,
        glucose_min_2h,
        glucose_max_2h,
        glucose_slope_2h,
        hr_mean_2h,
        hr_last,
        hrv_mean_2h,
        hrv_last,
        sleep_quality_score,
        steps_sum_2h,
        age,
        bmi,
        hba1c,
        diagnosis_years,
        family_history_flag,
        genetic_risk_score,
    ]
    return np.array(features, dtype=float)


def prepare_dataset_from_db() -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Loads all patient EHR and readings from SQLite.
    Constructs a sliding window dataset with time-based train/test partition:
      - Train: First 10 days of readings (Day 1 - 10)
      - Test:  Subsequent 4 days of readings (Day 11 - 14)
    Label: 1 if any glucose > 180 mg/dL in the next 2 hours (24 future steps), else 0.
    """
    with get_db() as conn:
        patients_df = pd.read_sql_query("SELECT * FROM patients;", conn)
        readings_df = pd.read_sql_query(
            "SELECT * FROM readings ORDER BY patient_id, timestamp ASC;",
            conn,
        )

    patients_map = {row["id"]: row.to_dict() for _, row in patients_df.iterrows()}

    # Lookback window: 2 hours = 24 steps
    # Horizon: 2 hours = 24 future steps
    LOOKBACK = 24
    HORIZON = 24

    train_rows = []
    test_rows = []

    # Process each patient chronologically
    for pid, group in readings_df.groupby("patient_id"):
        p_ehr = patients_map[pid]
        records = group.to_dict("records")
        n_records = len(records)

        # Time split boundary: first 10 days vs last 4 days
        # 14 days total -> 10/14 = 71.4%
        split_idx = int(n_records * (10.0 / 14.0))

        # Slide window by every 30 minutes (6 steps) to avoid excessive sample correlation
        step_stride = 6

        for i in range(LOOKBACK, n_records - HORIZON, step_stride):
            window = records[i - LOOKBACK : i]
            future = records[i : i + HORIZON]

            # Label: Any glucose in next 2 hours > 180 mg/dL
            future_max_g = max(float(r["glucose"]) for r in future)
            label = 1 if future_max_g > 180.0 else 0

            feat_vec = extract_features_from_window(window, p_ehr)
            row_dict = {name: feat_vec[idx] for idx, name in enumerate(FEATURE_NAMES)}
            row_dict["target"] = label
            row_dict["patient_id"] = pid

            if i < split_idx:
                train_rows.append(row_dict)
            else:
                test_rows.append(row_dict)

    df_train = pd.DataFrame(train_rows)
    df_test = pd.DataFrame(test_rows)
    return df_train, df_test


def train_and_save_model() -> Dict[str, Any]:
    """
    Trains the GradientBoostingClassifier on the fused time-series and EHR dataset.
    Evaluates on out-of-time test split.
    Saves model to joblib and metrics to metrics.json.
    """
    print("[ML] Constructing fused EHR + Wearable training and testing matrices...")
    df_train, df_test = prepare_dataset_from_db()

    X_train = df_train[FEATURE_NAMES]
    y_train = df_train["target"]

    X_test = df_test[FEATURE_NAMES]
    y_test = df_test["target"]

    print(f"[ML] Training set: {len(X_train)} samples (Spike rate: {y_train.mean():.1%})")
    print(f"[ML] Testing set:  {len(X_test)} samples (Spike rate: {y_test.mean():.1%})")

    clf = GradientBoostingClassifier(
        n_estimators=120,
        learning_rate=0.08,
        max_depth=4,
        subsample=0.85,
        random_state=42,
    )
    clf.fit(X_train, y_train)

    # Predictions
    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1]

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_test, y_prob))

    # Feature importances
    importances = {
        name: round(float(imp), 4)
        for name, imp in zip(FEATURE_NAMES, clf.feature_importances_)
    }
    # Sort descending
    sorted_importances = dict(sorted(importances.items(), key=lambda item: item[1], reverse=True))

    metrics_data = {
        "model_name": "GlucoTwin GradientBoostingClassifier",
        "algorithm": "Gradient Boosting (Scikit-Learn)",
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc_auc, 4),
        "total_samples": len(df_train) + len(df_test),
        "train_samples": len(df_train),
        "test_samples": len(df_test),
        "trained_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "feature_importances": sorted_importances,
    }

    # Save model and metrics
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(clf, MODEL_PATH)
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics_data, f, indent=2)

    print("[ML] Model training complete.")
    print(f"[ML] Accuracy: {acc:.4f} | Precision: {prec:.4f} | Recall: {rec:.4f} | ROC-AUC: {roc_auc:.4f}")
    return metrics_data


def get_model():
    """Loads model from disk, training if missing."""
    if not MODEL_PATH.exists() or not METRICS_PATH.exists():
        train_and_save_model()
    return joblib.load(MODEL_PATH)


def get_model_metrics() -> Dict[str, Any]:
    """Returns model evaluation metrics."""
    if not METRICS_PATH.exists() or not MODEL_PATH.exists():
        return train_and_save_model()
    with open(METRICS_PATH, "r") as f:
        return json.load(f)


def predict_for_patient(
    patient_id: int,
    extra_steps: int = 0,
    carb_intake_g: float = 0.0,
    sleep_hours_delta: float = 0.0,
    medication_taken: bool = True,
) -> Dict[str, Any]:
    """
    Generates a 2-hour adverse glucose spike (> 180 mg/dL) prediction for a patient.
    Supports What-If scenario counterfactual perturbations.
    """
    pid_int = int(patient_id)
    model = get_model()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM patients WHERE id = ?;", (pid_int,))
        patient = cursor.fetchone()
        if not patient:
            raise ValueError(f"Patient with ID {patient_id} not found")
        patient_dict = dict(patient)

        # Get latest 2 hours of readings (24 points)
        cursor.execute(
            """
            SELECT * FROM readings
            WHERE patient_id = ?
            ORDER BY timestamp DESC
            LIMIT 24;
            """,
            (pid_int,),
        )
        rows = cursor.fetchall()
        # Order chronologically
        readings_window = [dict(r) for r in reversed(rows)]

    # Compute baseline feature vector
    base_feat_vec = extract_features_from_window(readings_window, patient_dict)
    base_feat_dict = {name: base_feat_vec[idx] for idx, name in enumerate(FEATURE_NAMES)}

    # Base inference using DataFrame with explicit feature names
    X_base = pd.DataFrame([base_feat_dict])[FEATURE_NAMES]
    base_proba = float(model.predict_proba(X_base)[0, 1])

    is_what_if = (
        extra_steps > 0
        or carb_intake_g > 0
        or sleep_hours_delta != 0.0
        or not medication_taken
    )

    feat_dict = dict(base_feat_dict)

    if is_what_if:
        # Apply What-If perturbations
        # 1. Extra steps: enhances muscle glucose disposal, drops current/mean glucose and raises activity
        if extra_steps > 0:
            step_delta = min(extra_steps, 15000)
            feat_dict["steps_sum_2h"] += step_delta
            glucose_reduction = (step_delta / 1000.0) * 8.5  # ~8.5 mg/dL drop per 1,000 steps
            feat_dict["glucose_last"] = max(65.0, feat_dict["glucose_last"] - glucose_reduction)
            feat_dict["glucose_mean_2h"] = max(65.0, feat_dict["glucose_mean_2h"] - (glucose_reduction * 0.7))
            feat_dict["glucose_slope_2h"] = max(-50.0, feat_dict["glucose_slope_2h"] - (glucose_reduction * 0.4))

        # 2. Carbohydrate intake: raises slope and last glucose
        if carb_intake_g > 0:
            carb_impact = carb_intake_g * 0.65
            feat_dict["glucose_slope_2h"] += (carb_impact * 0.8)
            feat_dict["glucose_last"] += (carb_impact * 0.5)
            feat_dict["glucose_mean_2h"] += (carb_impact * 0.3)
            feat_dict["glucose_max_2h"] = max(feat_dict["glucose_max_2h"], feat_dict["glucose_last"])

        # 3. Sleep delta: modulates sleep score and HRV
        if sleep_hours_delta != 0.0:
            feat_dict["sleep_quality_score"] = min(100.0, max(20.0, feat_dict["sleep_quality_score"] + (sleep_hours_delta * 8.0)))
            feat_dict["hrv_mean_2h"] = min(80.0, max(15.0, feat_dict["hrv_mean_2h"] + (sleep_hours_delta * 3.0)))

        # 4. Medication non-adherence: increases baseline glycemic pressure
        if not medication_taken:
            feat_dict["glucose_last"] += 22.0
            feat_dict["glucose_mean_2h"] += 18.0

        # Evaluate model on counterfactual features
        X_cf = pd.DataFrame([feat_dict])[FEATURE_NAMES]
        cf_model_proba = float(model.predict_proba(X_cf)[0, 1])

        # Physiologically coherent bounding
        # Walking/exercise strictly reduces or maintains spike risk
        # Carbs strictly increase or maintain spike risk
        step_factor = (extra_steps / 10000.0) * 0.35
        carb_factor = (carb_intake_g / 100.0) * 0.40
        sleep_factor = (sleep_hours_delta / 8.0) * 0.12
        med_factor = 0.20 if not medication_taken else 0.0

        target_delta = carb_factor - step_factor - sleep_factor + med_factor
        blended_proba = 0.6 * cf_model_proba + 0.4 * (base_proba + target_delta)

        if extra_steps > 0 and carb_intake_g == 0 and medication_taken:
            proba = min(base_proba, blended_proba)
        elif carb_intake_g > 0 and extra_steps == 0:
            proba = max(base_proba, blended_proba)
        else:
            proba = blended_proba

        proba = float(np.clip(proba, 0.01, 0.99))
    else:
        proba = base_proba

    is_spike = bool(proba >= 0.50)

    # Risk level classification
    if proba >= 0.65:
        risk_level = "High"
    elif proba >= 0.35:
        risk_level = "Moderate"
    else:
        risk_level = "Low"

    # Compute top contributing features
    metrics = get_model_metrics()
    f_importances = metrics.get("feature_importances", {})

    contributing = []
    for f_name in FEATURE_NAMES:
        val = feat_dict[f_name]
        imp = f_importances.get(f_name, 0.0)

        # Determine directional impact
        direction = "increases_risk"
        if f_name in ["steps_sum_2h", "sleep_quality_score", "hrv_mean_2h", "hrv_last"]:
            # Higher values generally decrease risk
            direction = "decreases_risk" if val > 40 else "increases_risk"
        elif f_name in ["glucose_last", "glucose_mean_2h", "glucose_slope_2h", "hba1c", "bmi"]:
            direction = "increases_risk" if val > 130 or (f_name == "hba1c" and val > 7.0) else "decreases_risk"

        contributing.append({
            "feature": f_name,
            "display_name": FEATURE_LABELS.get(f_name, f_name),
            "value": round(val, 2),
            "importance": imp,
            "direction": direction,
        })

    # Sort by feature importance
    contributing.sort(key=lambda x: x["importance"], reverse=True)
    top_contributing = contributing[:5]

    # Generate plain-language explanation
    curr_g = feat_dict["glucose_last"]
    slope = feat_dict["glucose_slope_2h"]
    hba1c = patient_dict["hba1c"]
    steps = feat_dict["steps_sum_2h"]

    if risk_level == "High":
        explanation = (
            f"High probability ({proba:.0%}) of an adverse glucose spike (> 180 mg/dL) within 2 hours. "
            f"Current glucose is {curr_g:.0f} mg/dL with a rising velocity of {slope:+.1f} mg/dL/hr. "
            f"Static baseline HbA1c of {hba1c:.1f}% indicates high glycemic susceptibility, compounded by low recent steps ({int(steps)})."
        )
        recommendation = (
            "Initiate immediate preventative intervention: Recommend a 15–20 minute postprandial walk "
            "(~1,500 steps) to stimulate GLUT-4 translocation, hydrate, and delay additional carbohydrate intake."
        )
    elif risk_level == "Moderate":
        explanation = (
            f"Moderate risk ({proba:.0%}) of impending hyperglycemia. Current glucose is {curr_g:.0f} mg/dL. "
            f"Glycemic trend indicates elevated postprandial variability. Patient's baseline HbA1c is {hba1c:.1f}%."
        )
        recommendation = (
            "Continuous monitoring advised. A light 10-minute walk or avoidance of simple carbohydrates "
            "will help stabilize the glucose trajectory below the 180 mg/dL clinical threshold."
        )
    else:
        explanation = (
            f"Low probability ({proba:.0%}) of exceeding 180 mg/dL in the next 2 hours. "
            f"Glucose remains stable at {curr_g:.0f} mg/dL with adequate autonomic recovery and physical activity ({int(steps)} steps)."
        )
        recommendation = (
            "Continue standard regimen and maintain current activity levels. Virtual patient trajectory is well within target range."
        )

    latest_time = readings_window[-1]["timestamp"] if readings_window else datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    return {
        "patient_id": patient_id,
        "patient_name": patient_dict["name"],
        "current_glucose": round(curr_g, 1),
        "predicted_event": is_spike,
        "risk_probability": round(proba, 4),
        "risk_percentage": round(proba * 100, 1),
        "risk_level": risk_level,
        "top_contributing_features": top_contributing,
        "plain_language_explanation": explanation,
        "clinical_recommendation": recommendation,
        "timestamp": latest_time,
    }
