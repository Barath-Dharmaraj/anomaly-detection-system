from sqlalchemy import Column, Integer, Float, Boolean, String, DateTime, JSON, ForeignKey, func
from app.core.database import Base

class Prediction(Base):
    __tablename__ = "predictions"
    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount         = Column(Float)
    hour           = Column(Integer)
    day_of_week    = Column(Integer)
    merchant_cat   = Column(Integer)
    distance_km    = Column(Float)
    trans_per_day  = Column(Float)
    balance_ratio  = Column(Float)
    is_international = Column(Boolean)
    velocity_1h    = Column(Float)
    is_anomaly     = Column(Boolean, index=True)
    anomaly_score  = Column(Float)
    risk_level     = Column(String)
    label          = Column(Integer)
    confidence     = Column(Float)
    source         = Column(String, default="manual")
    batch_id       = Column(String, nullable=True, index=True)
    raw_input      = Column(JSON)
    created_at     = Column(DateTime(timezone=True), server_default=func.now(), index=True)
