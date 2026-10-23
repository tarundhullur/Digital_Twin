"""
GlucoTwin Pydantic Models
Request and response schemas with strict validation.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ==========================================
# AUTH MODELS
# ==========================================

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name")
    email: EmailStr = Field(..., description="Valid work/login email")
    password: str = Field(..., min_length=6, max_length=100, description="Password, at least 6 characters")
    role: Optional[str] = Field("doctor", description="User role, default doctor")


class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="Login email")
    password: str = Field(..., description="Password")


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_hours: int = 8
    user: UserResponse


# ==========================================
# PATIENT & EHR MODELS
# ==========================================

class PatientBase(BaseModel):
    name: str
    age: int
    sex: str
    bmi: float
    hba1c: float
    diagnosis_years: float
    family_history_flag: int
    genetic_marker: str
    medications: str


class PatientResponse(PatientBase):
    id: int
    created_at: Optional[str] = None
    latest_glucose: Optional[float] = None
    risk_level: Optional[str] = None


# ==========================================
# WEARABLE READINGS MODELS
# ==========================================

class ReadingBase(BaseModel):
    timestamp: str
    glucose: float
    heart_rate: float
    hrv: float
    sleep_stage: str
    steps: int


class ReadingResponse(ReadingBase):
    id: int
    patient_id: int


# ==========================================
# PREDICTION & DIGITAL TWIN MODELS
# ==========================================

class ContributingFeature(BaseModel):
    feature: str
    display_name: str
    value: float
    importance: float
    direction: str  # 'increases_risk' or 'decreases_risk'


class PredictionResponse(BaseModel):
    patient_id: int
    patient_name: str
    current_glucose: float
    predicted_event: bool  # True if predicted > 180 mg/dL in next 2 hours
    risk_probability: float  # 0.0 to 1.0
    risk_percentage: float  # 0 to 100%
    risk_level: str  # 'Low', 'Moderate', 'High'
    top_contributing_features: List[ContributingFeature]
    plain_language_explanation: str
    clinical_recommendation: str
    timestamp: str


class WhatIfRequest(BaseModel):
    extra_steps: Optional[int] = Field(0, description="Simulated immediate walk steps (0 to 10000)")
    carb_intake_g: Optional[float] = Field(0.0, description="Simulated upcoming carbohydrate intake in grams (0 to 150)")
    sleep_hours_delta: Optional[float] = Field(0.0, description="Simulated change in last night sleep hours (-4 to +4)")
    medication_taken: Optional[bool] = Field(True, description="Whether prescribed diabetes medication was adhered to")


class ModelMetricsResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    model_name: str
    algorithm: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    total_samples: int
    train_samples: int
    test_samples: int
    trained_at: str
    feature_importances: Dict[str, float]
