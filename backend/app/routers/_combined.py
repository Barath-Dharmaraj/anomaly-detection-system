from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user, get_admin_user
from app.models.user import User
from app.models.prediction import Prediction
from app.schemas.schemas import HistoryResponse, HistoryItem, StatsResponse
from fastapi import WebSocket, WebSocketDisconnect
from typing import Set
import json

# ── History ───────────────────────────────────────────────────────────────────
history_router = APIRouter()

@history_router.get("/", response_model=HistoryResponse)
async def get_history(page:int=Query(1,ge=1), page_size:int=Query(20,ge=1,le=100),
    anomaly_only:bool=Query(False), source:Optional[str]=None,
    db:AsyncSession=Depends(get_db), current_user:User=Depends(get_current_user)):
    q = select(Prediction).where(Prediction.user_id == current_user.id)
    if anomaly_only: q = q.where(Prediction.is_anomaly == True)
    if source: q = q.where(Prediction.source == source)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    anomaly_count = (await db.execute(select(func.count()).select_from(
        q.where(Prediction.is_anomaly == True).subquery()))).scalar()
    rows = (await db.execute(q.order_by(Prediction.created_at.desc())
        .offset((page-1)*page_size).limit(page_size))).scalars().all()
    return HistoryResponse(
        items=[HistoryItem(id=r.id,amount=r.amount,is_anomaly=r.is_anomaly,
            anomaly_score=r.anomaly_score,risk_level=r.risk_level,source=r.source,
            created_at=r.created_at) for r in rows],
        total=total, page=page, page_size=page_size, anomaly_count=anomaly_count)

# ── Admin ─────────────────────────────────────────────────────────────────────
admin_router = APIRouter()

@admin_router.get("/stats", response_model=StatsResponse)
async def get_stats(db:AsyncSession=Depends(get_db), _:User=Depends(get_admin_user)):
    total    = (await db.execute(select(func.count()).select_from(Prediction))).scalar()
    anomalies= (await db.execute(select(func.count()).select_from(Prediction).where(Prediction.is_anomaly==True))).scalar()
    avg      = (await db.execute(select(func.avg(Prediction.anomaly_score)))).scalar() or 0
    users    = (await db.execute(select(func.count()).select_from(User))).scalar()
    risk_rows= (await db.execute(select(Prediction.risk_level,func.count()).group_by(Prediction.risk_level))).all()
    return StatsResponse(total_predictions=total,total_anomalies=anomalies,
        anomaly_rate=round(anomalies/max(total,1),4),total_users=users,
        avg_anomaly_score=round(float(avg),4),risk_breakdown={r:c for r,c in risk_rows})

# ── WebSocket ─────────────────────────────────────────────────────────────────
ws_router = APIRouter()
_connections: Set[WebSocket] = set()

@ws_router.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    _connections.add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping": await websocket.send_text("pong")
    except WebSocketDisconnect:
        _connections.discard(websocket)

async def broadcast(message: dict):
    dead = set()
    for ws in _connections:
        try: await ws.send_text(json.dumps(message))
        except: dead.add(ws)
    _connections -= dead
