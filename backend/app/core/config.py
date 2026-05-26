from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    APP_NAME: str = "AnomalyGuard"
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_USE_32_CHAR_SECRET"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    DATABASE_URL: str = "sqlite+aiosqlite:///./anomaly_detection.db"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]
    MODEL_DIR: str = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        '..', '..', '..', 'model', 'saved'
    )

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
