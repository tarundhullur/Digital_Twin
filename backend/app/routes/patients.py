"""
GlucoTwin Patients Router
Endpoints:
  GET  /patients                  - List all patients with latest glucose & risk
  GET  /patients/{id}             - Retrieve patient static EHR profile
  GET  /patients/{id}/readings    - Retrieve dynamic wearable readings time series
  GET  /patients/{id}/predict     - Run 2-hour adverse spike prediction
  POST /patients/{id}/predict     - Run What-If counterfactual scenario
"""

from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Query, status, Depends

from app.db import get_db
from app.auth import get_current_user
from app.models import (
    PatientResponse,
    ReadingResponse,
    PredictionResponse,
    WhatIfRequest,
)
from app.ml import predict_for_patient

router = APIRouter(prefix="/patients", tags=["Patients & Digital Twins"])


@router.get("", response_model=List[PatientResponse])
def get_all_patients(current_user: dict = Depends(get_current_user)):
    """
    Returns all 20 virtual patients, enriched with latest continuous glucose
    reading and calculated risk level badge.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM patients ORDER BY id ASC;")
        patients = [dict(p) for p in cursor.fetchall()]

        # Attach latest reading and approximate risk for rapid dashboard rendering
        for p in patients:
            cursor.execute(
                """
                SELECT glucose FROM readings
                WHERE patient_id = ?
                ORDER BY timestamp DESC
                LIMIT 1;
                """,
                (p["id"],),
            )
            latest = cursor.fetchone()
            if latest:
                p["latest_glucose"] = round(latest["glucose"], 1)
                # Risk level based on latest glucose and HbA1c
                if latest["glucose"] > 165 or p["hba1c"] > 8.5:
                    p["risk_level"] = "High"
                elif latest["glucose"] > 130 or p["hba1c"] > 7.2:
                    p["risk_level"] = "Moderate"
                else:
                    p["risk_level"] = "Low"
            else:
                p["latest_glucose"] = None
                p["risk_level"] = "Unknown"

    return patients


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, current_user: dict = Depends(get_current_user)):
    """
    Returns single patient demographic, clinical diagnoses, and genetic marker EHR.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM patients WHERE id = ?;", (patient_id,))
        patient = cursor.fetchone()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient with ID {patient_id} not found.",
            )
        p = dict(patient)

        # Get latest glucose
        cursor.execute(
            """
            SELECT glucose FROM readings
            WHERE patient_id = ?
            ORDER BY timestamp DESC
            LIMIT 1;
            """,
            (patient_id,),
        )
        latest = cursor.fetchone()
        p["latest_glucose"] = round(latest["glucose"], 1) if latest else None
        p["risk_level"] = "High" if (p["latest_glucose"] and p["latest_glucose"] > 165) else "Low"

    return p


@router.get("/{patient_id}/readings", response_model=List[ReadingResponse])
def get_patient_readings(
    patient_id: int,
    hours: int = Query(24, ge=1, le=336, description="Hours of wearable readings to retrieve (1 to 336)"),
    current_user: dict = Depends(get_current_user),
):
    """
    Returns chronological wearable time-series (glucose, HR, HRV, sleep stage, steps)
    for the specified patient over the past N hours (default 24 hours).
    """
    # 12 readings per hour
    limit_readings = hours * 12

    with get_db() as conn:
        cursor = conn.cursor()
        # Verify patient exists
        cursor.execute("SELECT id FROM patients WHERE id = ?;", (patient_id,))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient with ID {patient_id} not found.",
            )

        # Retrieve the latest N readings in reverse then chronological order
        cursor.execute(
            """
            SELECT id, patient_id, timestamp, glucose, heart_rate, hrv, sleep_stage, steps
            FROM readings
            WHERE patient_id = ?
            ORDER BY timestamp DESC
            LIMIT ?;
            """,
            (patient_id, limit_readings),
        )
        rows = cursor.fetchall()

    # Reverse to return ascending chronological order for charts
    return [dict(r) for r in reversed(rows)]


@router.get("/{patient_id}/predict", response_model=PredictionResponse)
def predict_spike(
    patient_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Evaluates ML Gradient Boosting model on the fused stream:
    Predicts whether continuous glucose will exceed 180 mg/dL within the next 2 hours.
    Returns risk probability, risk level, top contributing features, and explanation.
    """
    try:
        return predict_for_patient(patient_id=patient_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}",
        )


@router.post("/{patient_id}/predict", response_model=PredictionResponse)
def predict_what_if(
    patient_id: int,
    what_if: WhatIfRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    What-If Counterfactual Digital Twin Simulation:
    Predicts adverse glucose event under prospective clinical or behavioral modifications
    (extra steps walk, carbohydrate intake, sleep duration change, medication adherence).
    """
    try:
        return predict_for_patient(
            patient_id=patient_id,
            extra_steps=what_if.extra_steps or 0,
            carb_intake_g=what_if.carb_intake_g or 0.0,
            sleep_hours_delta=what_if.sleep_hours_delta or 0.0,
            medication_taken=what_if.medication_taken if what_if.medication_taken is not None else True,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Counterfactual simulation error: {str(e)}",
        )
