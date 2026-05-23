import numpy as np, joblib, json, os
from typing import Dict, Any, List
from app.core.config import settings

class ModelService:
    _instance = None
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._loaded = False
        return cls._instance

    def load(self):
        if self._loaded: return
        d = settings.MODEL_DIR
        self.model  = joblib.load(os.path.join(d, 'isolation_forest.pkl'))
        self.scaler = joblib.load(os.path.join(d, 'scaler.pkl'))
        with open(os.path.join(d, 'model_meta.json')) as f: self.meta = json.load(f)
        with open(os.path.join(d, 'feature_importance.json')) as f: self.feature_importance = json.load(f)
        self.s_min = self.meta['score_min']
        self.s_max = self.meta['score_max']
        self._loaded = True

    def _engineer(self, raw: Dict[str, Any]) -> np.ndarray:
        amount        = float(raw.get('amount', 0))
        hour          = int(raw.get('hour', 12))
        day_of_week   = int(raw.get('day_of_week', 0))
        merchant_cat  = int(raw.get('merchant_cat', 0))
        distance_km   = float(raw.get('distance_km', 0))
        trans_per_day = float(raw.get('trans_per_day', 1))
        balance_ratio = float(raw.get('balance_ratio', 0.5))
        is_intl       = int(raw.get('is_international', 0))
        velocity_1h   = float(raw.get('velocity_1h', 0))
        log_amount    = np.log1p(amount)
        is_night      = int(0 <= hour <= 5)
        is_weekend    = int(day_of_week >= 5)
        amount_x_vel  = log_amount * velocity_1h
        return np.array([[amount, hour, day_of_week, merchant_cat, distance_km,
                          trans_per_day, balance_ratio, is_intl, velocity_1h,
                          log_amount, is_night, is_weekend, amount_x_vel]])

    def predict_one(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        self.load()
        X = self._engineer(raw)
        Xs = self.scaler.transform(X)
        raw_score = float(self.model.decision_function(Xs)[0])
        pred      = int(self.model.predict(Xs)[0])
        score = float(1 - (raw_score - self.s_min) / (self.s_max - self.s_min + 1e-9))
        score = max(0.0, min(1.0, score))
        is_anomaly = pred == -1
        return {
            "is_anomaly":    is_anomaly,
            "anomaly_score": round(score, 4),
            "label":         1 if is_anomaly else 0,
            "confidence":    round(abs(score - 0.5) * 2, 4),
            "risk_level":    ("CRITICAL" if score>=0.80 else "HIGH" if score>=0.60 else "MEDIUM" if score>=0.40 else "LOW"),
            "feature_importance": self.feature_importance,
        }

    def predict_batch(self, rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return [self.predict_one(r) for r in rows]

model_service = ModelService()
