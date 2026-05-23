from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.security import get_admin_user
from app.models.user import User
from app.models.prediction import Prediction
from app.schemas.schemas import StatsResponse

router = APIRouter()

@router.get("/stats", response_model=StatsResponse)
async def get_stats(db:AsyncSession=Depends(get_db), _:User=Depends(get_admin_user)):
    total    = (await db.execute(select(func.count()).select_from(Prediction))).scalar()
    anomalies= (await db.execute(select(func.count()).select_from(Prediction).where(Prediction.is_anomaly==True))).scalar()
    avg      = (await db.execute(select(func.avg(Prediction.anomaly_score)))).scalar() or 0
    users    = (await db.execute(select(func.count()).select_from(User))).scalar()
    risk_rows= (await db.execute(select(Prediction.risk_level,func.count()).group_by(Prediction.risk_level))).all()
    return StatsResponse(total_predictions=total,total_anomalies=anomalies,
        anomaly_rate=round(anomalies/max(total,1),4),total_users=users,
        avg_anomaly_score=round(float(avg),4),risk_breakdown={r:c for r,c in risk_rows})
