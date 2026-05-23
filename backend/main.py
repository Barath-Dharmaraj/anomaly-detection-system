from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine, Base
from app.routers import auth, predict, history, admin, ws

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

app = FastAPI(title="AnomalyGuard API", version="1.0.0", lifespan=lifespan)
app.add_middleware(GZipMiddleware)
app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router,    prefix="/auth",    tags=["Auth"])
app.include_router(predict.router, prefix="/predict", tags=["Predict"])
app.include_router(history.router, prefix="/history", tags=["History"])
app.include_router(admin.router,   prefix="/admin",   tags=["Admin"])
app.include_router(ws.router,      prefix="/ws",      tags=["WebSocket"])

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
