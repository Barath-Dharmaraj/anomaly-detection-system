from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.prediction import Prediction
from app.schemas.schemas import HistoryResponse, HistoryItem

router = APIRouter()

@router.get("/", response_model=HistoryResponse)
async def get_history(page:int=Query(1,ge=1), page_size:int=Query(20,ge=1,le=100),
    anomaly_only:bool=Query(False), source:str=Query(None),
    db:AsyncSession=Depends(get_db), current_user:User=Depends(get_current_user)):
    q = select(Prediction).where(Prediction.user_id == current_user.id)
    if anomaly_only: q = q.where(Prediction.is_anomaly == True)
    if source: q = q.where(Prediction.source == source)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    aq = select(func.count()).select_from(select(Prediction).where(
        Prediction.user_id==current_user.id, Prediction.is_anomaly==True).subquery())
    anomaly_count = (await db.execute(aq)).scalar()
    rows = (await db.execute(q.order_by(Prediction.created_at.desc())
        .offset((page-1)*page_size).limit(page_size))).scalars().all()
    return HistoryResponse(
        items=[HistoryItem(id=r.id,amount=r.amount,is_anomaly=r.is_anomaly,
            anomaly_score=r.anomaly_score,risk_level=r.risk_level,source=r.source,
            created_at=r.created_at) for r in rows],
        total=total, page=page, page_size=page_size, anomaly_count=anomaly_count)
