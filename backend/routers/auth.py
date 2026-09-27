"""Local-account auth: signup, login, current user."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from lib.auth import create_token, current_user, hash_password, verify_password
from lib.sql import get_session
from models.user import AuthResponse, LoginInput, SignupInput, User, UserPublic

router = APIRouter(prefix="/auth")


def _public(user: User) -> UserPublic:
    return UserPublic(id=user.id, name=user.name, email=user.email, created_at=user.created_at)


@router.post("/signup", response_model=AuthResponse, status_code=201)
async def signup(input: SignupInput, session: AsyncSession = Depends(get_session)):
    email = input.email.lower()
    existing = (await session.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Email ini sudah terdaftar — silakan masuk")
    user = User(email=email, name=input.name, password_hash=hash_password(input.password))
    session.add(user)
    await session.commit()
    return AuthResponse(token=create_token(user.id), user=_public(user))


@router.post("/login", response_model=AuthResponse)
async def login(input: LoginInput, session: AsyncSession = Depends(get_session)):
    user = (
        await session.execute(select(User).where(User.email == input.email.lower()))
    ).scalar_one_or_none()
    if not user or not verify_password(input.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email atau kata sandi salah")
    return AuthResponse(token=create_token(user.id), user=_public(user))


@router.get("/me", response_model=UserPublic)
async def me(user: User = Depends(current_user)):
    return _public(user)
