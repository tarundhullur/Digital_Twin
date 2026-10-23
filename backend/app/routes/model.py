"""
GlucoTwin Model Metrics Router
Endpoints:
  GET /model/metrics - Model performance metrics, train/test counts, ROC-AUC, and feature importances
"""

from fastapi import APIRouter, HTTPException, status, Depends
from app.auth import get_current_user
from app.models import ModelMetricsResponse
from app.ml import get_model_metrics

router = APIRouter(prefix="/model", tags=["Model Evaluation & Explainability"])


@router.get("/metrics", response_model=ModelMetricsResponse)
def get_metrics(current_user: dict = Depends(get_current_user)):
    """
    Returns the GradientBoostingClassifier evaluation metrics on the out-of-time test split:
    Accuracy, Precision, Recall, F1-Score, ROC-AUC, and feature importances.
    """
    try:
        metrics = get_model_metrics()
        return metrics
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve model metrics: {str(e)}",
        )
