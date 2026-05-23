from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class TransactionInput(BaseModel):
    amount:           float = Field(..., ge=0)
    hour:             int   = Field(..., ge=0, le=23)
    day_of_week:      int   = Field(..., ge=0, le=6)
    merchant_cat:     int   = Field(..., ge=0, le=4)
    distance_km:      float = Field(..., ge=0)
    trans_per_day:    float = Field(..., ge=0)
    balance_ratio:    float = Field(..., ge=0, le=1)
    is_international: bool  = False
    velocity_1h:      float = Field(0.0, ge=0)

class PredictionResponse(BaseModel):
    id:            int
    is_anomaly:    bool
    anomaly_score: float
    risk_level:    str
    label:         int
    confidence:    float
    feature_importance: Optional[Dict[str, float]] = None
    created_at:    datetime
    class Config:
        from_attributes = True

class HistoryItem(BaseModel):
    id:            int
    amount:        Optional[float]
    is_anomaly:    bool
    anomaly_score: float
    risk_level:    str
    source:        str
    created_at:    datetime
    class Config:
        from_attributes = True

class HistoryResponse(BaseModel):
    items:         List[HistoryItem]
    total:         int
    page:          int
    page_size:     int
    anomaly_count: int

class BatchResult(BaseModel):
    batch_id:      str
    total:         int
    anomaly_count: int
    normal_count:  int
    results:       List[Dict[str, Any]]

class StatsResponse(BaseModel):
    total_predictions: int
    total_anomalies:   int
    anomaly_rate:      float
    total_users:       int
    avg_anomaly_score: float
    risk_breakdown:    Dict[str, int]
