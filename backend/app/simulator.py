"""
GlucoTwin Synthetic Data Simulator
Simulates 20 synthetic Type 2 Diabetes patients and 14 days of 5-minute wearable readings.
Physiologically grounded:
  - eAG baseline scaled to HbA1c: eAG ~ (28.7 * HbA1c - 46.7)
  - Circadian rhythm (dawn phenomenon, nocturnal nadir)
  - Meal ingestion glucose excursion curves (breakfast, lunch, dinner, snacks)
  - Physical activity / step bouts inducing muscle glucose disposal
  - Sleep architecture (awake, light, deep, rem) and HRV autonomic tone
  - Fixed random seed for complete deterministic reproducibility
  - Exports to SQLite and data/*.csv
"""

import os
import random
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Tuple
import numpy as np
import pandas as pd

from app.db import get_db, DB_PATH, DATA_DIR

RANDOM_SEED = 42

PATIENT_NAMES = [
    ("Elena Rostova", "F"),
    ("Arthur Pendelton", "M"),
    ("Amina Al-Mansoor", "F"),
    ("David Kim", "M"),
    ("Priya Sharma", "F"),
    ("Carlos Morales", "M"),
    ("Grace Hopper", "F"),
    ("Marcus Sterling", "M"),
    ("Beatrice O'Connor", "F"),
    ("Hassan Tariq", "M"),
    ("Sunita Patel", "F"),
    ("Lukas Lindqvist", "M"),
    ("Fatima Zahra", "F"),
    ("Robert Chen", "M"),
    ("Mei-Ling Zhou", "F"),
    ("Samuel Jackson", "M"),
    ("Chloe Dupont", "F"),
    ("Alejandro Gomez", "M"),
    ("Ananya Roy", "F"),
    ("William Gallagher", "M"),
]

GENETIC_MARKERS = [
    "TCF7L2 rs7903146 (High Risk TT)",
    "TCF7L2 rs7903146 (Mod Risk CT)",
    "PPARG Pro12Ala (Variant)",
    "KCNJ11 E23K (Variant)",
    "Negative (Wild Type)",
]

MEDICATIONS_POOL = [
    "Metformin 1000mg BID",
    "Metformin 500mg BID + Empagliflozin 10mg QD",
    "Metformin 1000mg BID + Sitagliptin 100mg QD",
    "Semaglutide 0.5mg QW + Metformin 850mg BID",
    "Diet & Exercise Monotherapy",
    "Metformin 1000mg BID + Glimepiride 2mg QD",
    "Dapagliflozin 10mg QD + Metformin 1000mg BID",
]


def generate_synthetic_patients() -> List[Dict]:
    """Generates 20 distinct synthetic clinical profiles with fixed seed."""
    np.random.seed(RANDOM_SEED)
    random.seed(RANDOM_SEED)

    patients = []
    for idx, (name, sex) in enumerate(PATIENT_NAMES, start=1):
        # Age distribution: 40 - 75
        age = int(np.random.randint(42, 74))

        # BMI: 23.5 to 37.5
        bmi = round(float(np.random.uniform(23.8, 36.8)), 1)

        # HbA1c: 5.9% to 10.2%
        # Skew higher for some patients to exhibit true clinical diversity
        if idx % 3 == 0:
            hba1c = round(float(np.random.uniform(8.4, 10.2)), 1)  # Suboptimally controlled
        elif idx % 2 == 0:
            hba1c = round(float(np.random.uniform(7.1, 8.3)), 1)   # Moderately controlled
        else:
            hba1c = round(float(np.random.uniform(5.9, 7.0)), 1)   # Well controlled

        diagnosis_years = round(float(np.random.uniform(0.5, 16.0)), 1)
        family_history = int(np.random.choice([0, 1], p=[0.25, 0.75]))
        genetic_marker = GENETIC_MARKERS[(idx * 7) % len(GENETIC_MARKERS)]
        medications = MEDICATIONS_POOL[(idx * 3) % len(MEDICATIONS_POOL)]

        patients.append({
            "id": idx,
            "name": name,
            "age": age,
            "sex": sex,
            "bmi": bmi,
            "hba1c": hba1c,
            "diagnosis_years": diagnosis_years,
            "family_history_flag": family_history,
            "genetic_marker": genetic_marker,
            "medications": medications,
        })

    return patients


def simulate_patient_readings(
    patient: Dict,
    start_date: datetime,
    days: int = 14
) -> List[Dict]:
    """
    Simulates 14 days of 5-minute CGM and wearable readings (4,032 points per patient).
    Physiological model captures:
      - Estimated Average Glucose (eAG) baseline = 28.7 * HbA1c - 46.7
      - Circadian rhythm with dawn phenomenon (04:00 - 08:00)
      - Meals at 08:00, 13:00, 19:30, optional snack at 21:30
      - Postprandial glucose dynamics (gamma-like curve rise over 45m, fall over 120m)
      - Steps and physical activity inducing glucose clearance
      - Autonomic tone: Heart rate, HRV, and sleep stages
    """
    pid = patient["id"]
    # Seed specifically per patient for unique, repeatable trajectory
    np.random.seed(RANDOM_SEED + pid * 100)
    random.seed(RANDOM_SEED + pid * 100)

    hba1c = patient["hba1c"]
    bmi = patient["bmi"]
    # Base glucose from HbA1c
    eag_baseline = 28.7 * hba1c - 46.7
    # Baseline modifier based on BMI (insulin resistance index)
    baseline_glucose = eag_baseline * (0.92 + (bmi - 25.0) * 0.008)

    readings = []
    total_steps = days * 24 * 12  # 5-minute intervals

    # Maintain continuous state
    current_glucose = baseline_glucose + np.random.normal(0, 4)
    active_meal_absorption = 0.0
    active_exercise_effect = 0.0

    for step_i in range(total_steps):
        current_time = start_date + timedelta(minutes=step_i * 5)
        minute_of_day = current_time.hour * 60 + current_time.minute
        hour_fraction = minute_of_day / 60.0

        # ------------------------------------
        # 1. Sleep Architecture & Circadian
        # ------------------------------------
        is_sleeping = (hour_fraction >= 23.0 or hour_fraction < 7.0)
        if is_sleeping:
            # Sleep stage cycling (90 min cycles)
            cycle_pos = (minute_of_day % 90) / 90.0
            if cycle_pos < 0.15:
                sleep_stage = "awake"
            elif cycle_pos < 0.55:
                sleep_stage = "light"
            elif cycle_pos < 0.80:
                sleep_stage = "deep"
            else:
                sleep_stage = "rem"

            # Sleep heart rate and HRV
            base_hr = 58.0 + (bmi * 0.3)
            if sleep_stage == "deep":
                hr = base_hr - 6.0 + np.random.normal(0, 1.5)
                hrv = 48.0 - (patient["age"] * 0.25) + np.random.normal(0, 3)
            elif sleep_stage == "rem":
                hr = base_hr + 2.0 + np.random.normal(0, 2.0)
                hrv = 36.0 - (patient["age"] * 0.25) + np.random.normal(0, 3)
            else:
                hr = base_hr + np.random.normal(0, 2.0)
                hrv = 40.0 - (patient["age"] * 0.25) + np.random.normal(0, 3)
            steps = 0 if sleep_stage != "awake" else int(np.random.choice([0, 12], p=[0.9, 0.1]))
        else:
            sleep_stage = "awake"
            base_hr = 70.0 + (bmi * 0.4)
            # Daytime step opportunities: commute/morning, lunch walk, evening
            step_prob = 0.25
            if (7.5 <= hour_fraction <= 8.5) or (12.5 <= hour_fraction <= 13.5) or (17.5 <= hour_fraction <= 19.0):
                step_prob = 0.65

            if np.random.rand() < step_prob:
                steps = int(np.random.exponential(scale=110) + 20)
                steps = min(steps, 650)
            else:
                steps = int(np.random.choice([0, 15, 35], p=[0.7, 0.2, 0.1]))

            # Physical exertion raises HR and lowers HRV
            exertion_factor = min(steps / 300.0, 1.5)
            hr = base_hr + (exertion_factor * 35.0) + np.random.normal(0, 3.5)
            hrv = max(18.0, 42.0 - (exertion_factor * 16.0) - (patient["age"] * 0.2) + np.random.normal(0, 4))

        hr = round(float(np.clip(hr, 48.0, 165.0)), 1)
        hrv = round(float(np.clip(hrv, 14.0, 95.0)), 1)

        # ------------------------------------
        # 2. Meal Ingestion (Exogenous Glucose)
        # ------------------------------------
        # Breakfast: 07:30 - 08:30
        # Lunch: 12:30 - 13:30
        # Dinner: 19:00 - 20:00
        # Snack: 15:30 - 16:00
        meal_carbs = 0.0
        if current_time.minute == 0 or current_time.minute == 30:
            if current_time.hour == 8 and current_time.minute == 0:
                meal_carbs = float(np.random.uniform(35, 65))
            elif current_time.hour == 13 and current_time.minute == 0:
                meal_carbs = float(np.random.uniform(45, 80))
            elif current_time.hour == 19 and current_time.minute == 30:
                meal_carbs = float(np.random.uniform(50, 95))
            elif current_time.hour == 16 and current_time.minute == 0 and np.random.rand() < 0.4:
                meal_carbs = float(np.random.uniform(15, 30))

        # Insulin resistance multiplier: higher HbA1c and BMI yield bigger spikes
        ir_scale = 1.0 + (hba1c - 6.0) * 0.18 + (bmi - 25.0) * 0.02
        if meal_carbs > 0:
            active_meal_absorption += (meal_carbs * 1.65 * ir_scale)

        # Meal absorption decay (exponential clearance with half-life ~ 45 min)
        glucose_influx = active_meal_absorption * 0.075
        active_meal_absorption = max(0.0, active_meal_absorption - glucose_influx)

        # ------------------------------------
        # 3. Exercise Glucose Disposal
        # ------------------------------------
        # Steps induce muscle glucose uptake that lingers for ~45 min
        step_uptake = (steps / 100.0) * 1.8
        active_exercise_effect = (active_exercise_effect * 0.88) + step_uptake
        glucose_clearance = active_exercise_effect * 0.25

        # ------------------------------------
        # 4. Circadian Dawn Phenomenon & Diurnal Fluctuation
        # ------------------------------------
        # Dawn phenomenon: hepatic gluconeogenesis surge between 04:30 and 07:30
        dawn_surge = 0.0
        if 4.5 <= hour_fraction <= 7.5:
            dawn_surge = np.sin((hour_fraction - 4.5) / 3.0 * np.pi) * (14.0 + (hba1c * 1.5))

        # Nocturnal dip between 01:00 and 04:00
        night_dip = 0.0
        if 1.0 <= hour_fraction < 4.0:
            night_dip = 8.0

        # Mean reversion to baseline
        mean_reversion = 0.035 * (baseline_glucose + dawn_surge - night_dip - current_glucose)

        # Autonomic stress effect: low HRV correlates with sympathetic glucose release
        stress_bump = max(0.0, (28.0 - hrv) * 0.15)

        # Stochastic noise
        noise = np.random.normal(0, 1.2)

        # Update glucose
        delta_g = mean_reversion + glucose_influx - glucose_clearance + stress_bump + noise
        current_glucose += delta_g
        current_glucose = float(np.clip(current_glucose, 55.0, 340.0))

        readings.append({
            "patient_id": pid,
            "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
            "glucose": round(current_glucose, 1),
            "heart_rate": hr,
            "hrv": hrv,
            "sleep_stage": sleep_stage,
            "steps": steps,
        })

    return readings


def generate_and_seed_data(force: bool = False) -> Tuple[int, int]:
    """
    Generates 20 synthetic patients and 14 days of 5-min readings.
    Saves to SQLite and data/ CSV files.
    Skips if data already exists, unless force=True.
    """
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    patients_csv_path = DATA_DIR / "patients.csv"
    readings_csv_path = DATA_DIR / "readings.csv"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM patients;")
        count = cursor.fetchone()["count"]

        if count >= 20 and not force:
            cursor.execute("SELECT COUNT(*) as r_count FROM readings;")
            r_count = cursor.fetchone()["r_count"]
            print(f"[SIMULATOR] Database already seeded with {count} patients and {r_count} readings.")
            return count, r_count

        print("[SIMULATOR] Generating synthetic patients and 14-day 5-min wearable time series...")
        # Clear existing if force
        if force:
            cursor.execute("DELETE FROM readings;")
            cursor.execute("DELETE FROM patients;")

        patients = generate_synthetic_patients()

        # Insert patients into DB
        for p in patients:
            cursor.execute(
                """
                INSERT INTO patients (
                    id, name, age, sex, bmi, hba1c, diagnosis_years,
                    family_history_flag, genetic_marker, medications
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    p["id"],
                    p["name"],
                    p["age"],
                    p["sex"],
                    p["bmi"],
                    p["hba1c"],
                    p["diagnosis_years"],
                    p["family_history_flag"],
                    p["genetic_marker"],
                    p["medications"],
                ),
            )

        # Baseline timestamp starting 14 days ago up to current time
        end_time = datetime(2026, 10, 22, 12, 0, 0)
        start_time = end_time - timedelta(days=14)

        all_readings = []
        for p in patients:
            patient_readings = simulate_patient_readings(p, start_time, days=14)
            all_readings.extend(patient_readings)

        # Bulk insert readings in chunks for optimal SQLite performance
        chunk_size = 5000
        for i in range(0, len(all_readings), chunk_size):
            chunk = all_readings[i : i + chunk_size]
            cursor.executemany(
                """
                INSERT INTO readings (
                    patient_id, timestamp, glucose, heart_rate, hrv, sleep_stage, steps
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        r["patient_id"],
                        r["timestamp"],
                        r["glucose"],
                        r["heart_rate"],
                        r["hrv"],
                        r["sleep_stage"],
                        r["steps"],
                    )
                    for r in chunk
                ],
            )

    # Export to CSV for data archival and reproducibility
    patients_df = pd.DataFrame(patients)
    patients_df.to_csv(patients_csv_path, index=False)

    readings_df = pd.DataFrame(all_readings)
    readings_df.to_csv(readings_csv_path, index=False)

    print(f"[SIMULATOR] Successfully generated {len(patients)} patients and {len(all_readings)} readings.")
    print(f"[SIMULATOR] Exported to {patients_csv_path} and {readings_csv_path}.")

    return len(patients), len(all_readings)


if __name__ == "__main__":
    generate_and_seed_data(force=True)
