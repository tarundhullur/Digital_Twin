# GlucoTwin – Digital Twin for Type 2 Diabetes

> **Proof-of-Concept Virtual Patient Model Fusing Static EHR & Dynamic Wearable Telemetry for Acute Hyperglycemic Spike Prediction**  
> *Submitted for the **Digital Twin Challenge 2026** (Happiest Health)*

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Python: 3.11](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/Frontend-React%2019-61dafb.svg)](https://react.dev/)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn-orange.svg)](https://scikit-learn.org/)
[![Synthetic Data: DPDP/HIPAA Safe](https://img.shields.io/badge/Data-DPDP%2FHIPAA%20Safe%20(Synthetic)-green.svg)](#data-sandbox--compliance-notice)

---

## 1. Team & Submission Details

- **Project Title**: GlucoTwin – Digital Twin for Type 2 Diabetes
- **Challenge**: Digital Twin Challenge 2026 (Happiest Health)
- **Team Name**: Team BioTwin Innovators
- **Institution / Incubator**: Department of Computational Medicine & Biomedical Informatics, HealthTech Innovation Hub
- **Repository License**: Open Source MIT License
- **Primary Clinician Persona**: Attending Physician / Endocrinologist (`doctor@demo.com`)

---

## 2. Problem Statement & Healthcare Use Case

Type 2 Diabetes (T2D) affects over 530 million individuals globally. Acute postprandial glucose excursions exceeding **180 mg/dL** trigger severe endothelial shear stress, oxidative inflammation, and β-cell exhaustion, accelerating cardiovascular diseases, diabetic retinopathy, and peripheral neuropathy.

### The Clinical Dilemma: Reactive vs. Prospective Care
Traditional continuous glucose monitoring (CGM) is **retrospective**: alarms trigger only *after* hyperglycemia has already occurred. By the time a patient realizes their glucose has surpassed 200 mg/dL, the physiological injury is already underway, and corrective insulin or physical exertion takes 60–90 minutes to blunt the excursion.

### The GlucoTwin Solution
GlucoTwin creates an **algorithmic virtual patient twin** by fusing:
1. **Static Clinical EHR**: Demographics, BMI, glycated hemoglobin (HbA1c), duration of diabetes, family history, and genetic markers (*TCF7L2*, *PPARG*, *KCNJ11*).
2. **Dynamic Wearable Telemetry**: 5-minute continuous glucose readings, heart rate, heart rate variability (HRV autonomic tone), sleep architecture, and physical activity step counts.

**Clinical Output**:
- Predicts adverse glucose spikes **above 180 mg/dL within the next 2 hours** with **99.0% ROC-AUC** and **94.7% accuracy**.
- Provides transparent **plain-language clinical explanations** and actionable counter-measures.
- Features an interactive **"What-If" Counterfactual Simulation Engine** allowing doctors and patients to prospectively model the glycemic impact of postprandial walking, carbohydrate intake, and medication adherence.

---

## 3. Data Sandbox & Compliance Notice

```
┌────────────────────────────────────────────────────────────────────────┐
│  SYNTHETIC DATA ONLY – DPDP & HIPAA COMPLIANT SANDBOX                  │
│                                                                        │
│  All 20 patient profiles, 14 days of 5-minute readings (80,640 records),│
│  genotypic flags, and medical records are 100% synthetically generated │
│  via deterministic mathematical models. No Protected Health Information│
│  (PHI) or real patient records are ingested, stored, or exposed.       │
└────────────────────────────────────────────────────────────────────────┘
```

The synthetic generator (`backend/app/simulator.py`) models:
- Baseline Estimated Average Glucose: $\text{eAG} = 28.7 \times \text{HbA1c} - 46.7$
- Diurnal circadian rhythm & hepatic dawn phenomenon gluconeogenesis (04:30–07:30)
- Exogenous meal carbohydrate absorption curves (breakfast, lunch, dinner, snacks)
- Muscular GLUT-4 glucose clearance proportional to physical step bouts
- Autonomic cardiovascular tone (HR and HRV) correlated with sleep stages and physiological stress.

---

## 4. Technical Stack

| Tier | Technologies | Purpose |
|---|---|---|
| **Backend** | Python 3.11, FastAPI, Uvicorn, SQLite3 | High-performance async REST API, transactional data persistence |
| **Machine Learning** | Scikit-Learn, Pandas, NumPy, Joblib | GradientBoostingClassifier, 18 fused features, out-of-time validation |
| **Security & Auth** | Python-Jose (JWT), Passlib, `bcrypt==4.0.1` | Stateless 8-hour JWT authentication, password hashing |
| **Frontend** | React 19, Vite 8, React Router 7, Tailwind CSS 4 | Single-page clinical application, reactive dashboard |
| **Data Visualization** | Recharts, Lucide React | 2-second live stream replay, area charts with 180 mg/dL threshold, risk gauges |
| **Testing** | Pytest, HTTPX | Comprehensive unit, algorithmic, and live end-to-end test suites |

---

## 5. AI / ML Model & Algorithmic Formulation

### 18-Feature Multimodal Fusion Vector
For any prediction window at time $T$, the feature fusion engine extracts:
- **Glycemic Stream (2h Lookback)**: `glucose_last`, `glucose_mean_2h`, `glucose_std_2h`, `glucose_min_2h`, `glucose_max_2h`, `glucose_slope_2h` ($\Delta\text{mg/dL/hr}$).
- **Autonomic Tone (2h Lookback)**: `hr_mean_2h`, `hr_last`, `hrv_mean_2h`, `hrv_last`.
- **Lifestyle & Activity**: `sleep_quality_score` (deep/REM restorative ratio), `steps_sum_2h`.
- **Static EHR Features**: `age`, `bmi`, `hba1c`, `diagnosis_years`, `family_history_flag`, `genetic_risk_score`.

### Out-of-Time Chronological Validation (Zero Leakage)
To prevent temporal data leakage across 5-minute continuous readings, GlucoTwin strictly partitions all patients chronologically:
- **Training Cohort**: Days 1 through 10 (71.4% of data)
- **Evaluation Cohort**: Days 11 through 14 (28.6% out-of-time test set)

### Model Performance Metrics

| Metric | Out-of-Time Test Score | Clinical Interpretation |
|---|---|---|
| **ROC-AUC** | **0.990** | Outstanding discrimination between spike and stable glycemic curves |
| **Accuracy** | **94.7%** | High overall predictive reliability on unseen patient time periods |
| **Precision** | **96.8%** | Minimized false positives; prevents clinical alert fatigue |
| **Recall / Sensitivity** | **93.2%** | High capture rate of dangerous impending spikes |
| **F1-Score** | **95.0%** | Robust harmonic balance between precision and sensitivity |

---

## 6. Screenshots & Interface Overview

### 1. Cohort Risk Stratification Dashboard
![Cohort Dashboard Placeholder](docs/screenshots/dashboard.png)
*Clinician cohort overview displaying all 20 virtual patient twins with risk badges (High, Moderate, Low), latest glucose, HbA1c, and genetic variants.*

### 2. Patient Digital Twin & Real-Time Stream Replay
![Patient Twin Stream Placeholder](docs/screenshots/patient_twin.png)
*Live continuous glucose replay stream updating every 2 seconds. Features clinical spike threshold line at 180 mg/dL and radial 2-hour risk gauge.*

### 3. Prospective "What-If" Counterfactual Intervention Panel
![What-If Simulator Placeholder](docs/screenshots/what_if.png)
*Clinicians test physical activity (+steps), carbohydrate ingestion, sleep changes, and medication adherence to prospectively observe risk reduction.*

### 4. Algorithmic Explainability & Model Metrics
![Model Metrics Placeholder](docs/screenshots/model_metrics.png)
*Transparent SHAP-aligned Gini feature importance ranking and out-of-time validation metrics.*

---

## 7. Setup & Execution Instructions

### Option A: Standard Two-Terminal Setup

#### Terminal 1 – Backend (FastAPI on Port 8000)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Terminal 2 – Frontend (React + Vite on Port 3000)
```bash
npm install
npm run dev
```

Visit **http://localhost:3000** in your web browser.

---

## 8. Demo Credentials

| Role | Email | Password | Quick Access |
|---|---|---|---|
| Attending Doctor | `doctor@demo.com` | `Demo@1234` | Click **"One-Click Demo Doctor Sign-In"** on login screen |

---

## 9. Automated Testing & Verification

Run the full automated test suite:

```bash
# Comprehensive Pytest Suite (Unit, Auth, EHR, Streams, ML, What-If)
python3 -m pytest tests/test_full_suite.py -v

# End-to-End Live Workflow Verification
python3 tests/e2e_flow_verification.py
```

---

## 10. Repository File Structure

```
Team_College/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI entrypoint, CORS, lifespan hooks
│   │   ├── auth.py            # JWT token creation (8h), bcrypt hashing, auth guards
│   │   ├── db.py              # SQLite schema, connection management, demo seeding
│   │   ├── models.py          # Pydantic validation schemas
│   │   ├── ml.py              # Feature engineering, GradientBoosting, What-If simulation
│   │   ├── simulator.py       # Physiological synthetic data generator (20 patients, 14 days)
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── auth.py        # /auth/register, /auth/login, /auth/me
│   │       ├── patients.py    # /patients, /readings, /predict
│   │       └── model.py       # /model/metrics
│   └── requirements.txt       # Pinned backend dependencies
├── src/
│   ├── api/
│   │   └── client.ts          # Axios client with JWT interceptor
│   ├── context/
│   │   └── AuthContext.tsx    # Clinician session provider
│   ├── components/
│   │   ├── Navbar.tsx         # Clinical header & DPDP/HIPAA badge
│   │   └── ProtectedRoute.tsx # Route authentication guard
│   ├── pages/
│   │   ├── LoginPage.tsx      # Provider sign-in with 1-click demo
│   │   ├── RegisterPage.tsx   # Clinician registration
│   │   ├── DashboardPage.tsx  # 20-patient cohort & risk stratification
│   │   ├── PatientTwinPage.tsx# 2s stream replay, 180 threshold, What-If sliders
│   │   └── ModelMetricsPage.tsx# Model evaluation & feature importance
│   ├── App.tsx                # React Router setup
│   ├── main.tsx               # DOM mount
│   └── index.css              # Tailwind styling
├── data/                      # Generated synthetic datasets (patients.csv, readings.csv, glucotwin.db)
├── docs/
│   ├── architecture.md        # Technical architecture & Mermaid system diagram
│   └── demo_script.md         # 20-minute presentation & live walkthrough script
├── tests/
│   ├── test_phase1.py         # Phase 1 backend & auth tests
│   ├── test_phase2.py         # Phase 2 simulator & physiological realism tests
│   ├── test_phase3.py         # Phase 3 ML model & predict tests
│   ├── test_full_suite.py     # Hardened complete test suite
│   └── e2e_flow_verification.py# Live end-to-end HTTP integration script
├── LICENSE                    # Open Source MIT License
├── README.md                  # Main project documentation
├── run.md                     # Quick run & command reference
├── package.json               # Frontend dependencies & scripts
├── vite.config.ts             # Vite build & backend proxy configuration
└── tsconfig.json              # TypeScript configuration
```

---

## 11. License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for complete details.
Distributed freely for academic, clinical, and open-source evaluation.
