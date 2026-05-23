from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.models.user import User
from app.schemas.schemas import RegisterRequest, LoginRequest, TokenResponse

router = APIRouter()

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    exists = await db.execute(select(User).where((User.email == body.email) | (User.username == body.username)))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email or username already registered")
    user = User(email=body.email, username=body.username, hashed_pw=hash_password(body.password))
    db.add(user)
    await db.flush()
    await db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user={"id":user.id,"email":user.email,"username":user.username,"is_admin":user.is_admin})

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_pw):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user={"id":user.id,"email":user.email,"username":user.username,"is_admin":user.is_admin})

@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {"id":current_user.id,"email":current_user.email,"username":current_user.username,"is_admin":current_user.is_admin}
