from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
import csv, io, uuid
from app.core.database import get_db
from app.core.security import get_current_user
from app.ml.predictor import model_service
from app.models.user import User
from app.models.prediction import Prediction
from app.schemas.schemas import TransactionInput, PredictionResponse, BatchResult
from app.routers.ws import broadcast

router = APIRouter()

async def _save(db, user_id, tx, result, source="manual", batch_id=None):
    pred = Prediction(user_id=user_id, amount=tx.get('amount'), hour=tx.get('hour'),
        day_of_week=tx.get('day_of_week'), merchant_cat=tx.get('merchant_cat'),
        distance_km=tx.get('distance_km'), trans_per_day=tx.get('trans_per_day'),
        balance_ratio=tx.get('balance_ratio'), is_international=tx.get('is_international',False),
        velocity_1h=tx.get('velocity_1h',0), is_anomaly=result['is_anomaly'],
        anomaly_score=result['anomaly_score'], risk_level=result['risk_level'],
        label=result['label'], confidence=result['confidence'],
        source=source, batch_id=batch_id, raw_input=tx)
    db.add(pred)
    await db.flush()
    await db.refresh(pred)
    return pred

@router.post("/", response_model=PredictionResponse)
async def predict_single(body: TransactionInput, background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        result = model_service.predict_one(body.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model error: {e}")
    pred = await _save(db, current_user.id, body.model_dump(), result)
    background_tasks.add_task(broadcast, {"type":"prediction","user":current_user.username,
        "is_anomaly":result['is_anomaly'],"risk_level":result['risk_level'],"score":result['anomaly_score']})
    return PredictionResponse(id=pred.id, is_anomaly=result['is_anomaly'],
        anomaly_score=result['anomaly_score'], risk_level=result['risk_level'],
        label=result['label'], confidence=result['confidence'],
        feature_importance=result.get('feature_importance'), created_at=pred.created_at)

@router.post("/upload", response_model=BatchResult)
async def predict_batch(file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files accepted")
    content = await file.read()
    rows = list(csv.DictReader(io.StringIO(content.decode('utf-8'))))
    if not rows: raise HTTPException(status_code=400, detail="Empty CSV")
    if len(rows) > 5000: raise HTTPException(status_code=400, detail="Max 5000 rows")
    batch_id = str(uuid.uuid4())
    results = []; anomaly_count = 0
    for row in rows:
        try:
            tx = {'amount':float(row.get('amount',0)),'hour':int(float(row.get('hour',12))),
                'day_of_week':int(float(row.get('day_of_week',0))),'merchant_cat':int(float(row.get('merchant_cat',0))),
                'distance_km':float(row.get('distance_km',0)),'trans_per_day':float(row.get('trans_per_day',1)),
                'balance_ratio':float(row.get('balance_ratio',0.5)),
                'is_international':bool(int(float(row.get('is_international',0)))),'velocity_1h':float(row.get('velocity_1h',0))}
            r = model_service.predict_one(tx)
            await _save(db, current_user.id, tx, r, source='batch', batch_id=batch_id)
            if r['is_anomaly']: anomaly_count += 1
            results.append({**tx, **r})
        except Exception as e:
            results.append({'error': str(e)})
    return BatchResult(batch_id=batch_id, total=len(rows), anomaly_count=anomaly_count,
        normal_count=len(rows)-anomaly_count, results=results)
