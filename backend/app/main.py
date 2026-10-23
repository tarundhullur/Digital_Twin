"""
GlucoTwin – Digital Twin for Type 2 Diabetes
Main FastAPI Application Entrypoint
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import init_db, seed_demo_doctor
from app.simulator import generate_and_seed_data
from app.ml import MODEL_PATH, METRICS_PATH, train_and_save_model
from app.routes.auth import router as auth_router
from app.routes.patients import router as patients_router
from app.routes.model import router as model_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle hook: initialize database schema, seed doctor, seed synthetic data, and ensure ML model is trained."""
    print("[INIT] Initializing GlucoTwin SQLite database...")
    init_db()
    seed_demo_doctor()
    print("[INIT] Checking synthetic data presence...")
    generate_and_seed_data(force=False)
    print("[INIT] Checking ML model presence...")
    if not MODEL_PATH.exists() or not METRICS_PATH.exists():
        print("[INIT] Model missing. Training GradientBoostingClassifier...")
        train_and_save_model()
    else:
        print("[INIT] Model and metrics already present.")
    yield
    print("[SHUTDOWN] GlucoTwin backend shutdown.")


app = FastAPI(
    title="GlucoTwin API",
    description="Digital Twin for Type 2 Diabetes: Ingests Static EHR & Dynamic Wearables, Predicts 2h Glucose Spikes (>180 mg/dL)",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration: Allow http://localhost:5173, http://localhost:3000, and preview domains
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(model_router)


@app.get("/")
def root():
    return {
        "project": "GlucoTwin – Digital Twin for Type 2 Diabetes",
        "challenge": "Digital Twin Challenge 2026 (Happiest Health)",
        "compliance": "Synthetic data only – DPDP/HIPAA safe",
        "status": "online",
        "version": "1.0.0",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "sqlite3",
        "synthetic_data_badge": "Synthetic data only – DPDP/HIPAA safe",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
