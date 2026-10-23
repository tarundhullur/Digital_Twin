# GlucoTwin – Run & Execution Guide

This document describes how to set up, run, and evaluate the **GlucoTwin** Digital Twin platform locally.

---

## 1. Prerequisites

- **Python**: Version 3.10 or 3.11
- **Node.js**: Version 18.x or 20.x
- **Package Managers**: `pip` and `npm`

---

## 2. Quick Start Commands

### Backend (FastAPI + ML Model + SQLite)

Open a terminal window and run:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

*Note: On first startup, the backend will automatically initialize the SQLite database (`data/glucotwin.db`), seed 20 synthetic patients with 14 days of 5-minute readings (80,640 records), and train the GradientBoostingClassifier model with out-of-time evaluation.*

- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

### Frontend (React + Vite + Recharts + Tailwind)

In a second terminal window, run:

```bash
npm install
npm run dev
```

- **Application URL**: [http://localhost:3000](http://localhost:3000) (or [http://localhost:5173](http://localhost:5173))
- **Demo Doctor Login**:
  - **Email**: `doctor@demo.com`
  - **Password**: `Demo@1234`
  - *(Or click the **One-Click Demo Doctor Sign-In** button on the login screen)*

---

## 3. Running Automated Test Suites

### Full Pytest Suite

Run all unit, integration, and algorithmic verification tests:

```bash
python3 -m pytest tests/test_full_suite.py -v
```

### End-to-End Workflow Verification

With both frontend and backend active, verify the complete clinical journey (Register &rarr; Login &rarr; Dashboard &rarr; Live Stream &rarr; What-If &rarr; Metrics &rarr; Logout):

```bash
python3 tests/e2e_flow_verification.py
```

---

## 4. Default Seeded Credentials

| Role | Name | Email | Password |
|---|---|---|---|
| Attending Endocrinologist | Dr. Sarah Chen, MD | `doctor@demo.com` | `Demo@1234` |

---

## 5. Synthetic Data Compliance Notice

> **Synthetic data only – DPDP/HIPAA safe**: All clinical parameters, wearable time-series, demographics, and genetic markers are 100% synthetically generated via physiological mathematical models. No real Protected Health Information (PHI) or personally identifiable information is used or stored.
