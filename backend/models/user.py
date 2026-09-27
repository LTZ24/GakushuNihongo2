"""SQLAlchemy tables (MySQL) + Pydantic v2 schemas for accounts and per-user progress."""

import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from lib.sql import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------- SQL tables


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    attempts: Mapped[list["Attempt"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    chapter_progress: Mapped[list["ChapterProgress"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Attempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    quiz_type: Mapped[str] = mapped_column(String(20))
    scope_type: Mapped[str] = mapped_column(String(20))
    scope_value: Mapped[str] = mapped_column(String(20))
    scope_label: Mapped[str] = mapped_column(String(80))
    score: Mapped[int] = mapped_column(Integer)
    total: Mapped[int] = mapped_column(Integer)
    percentage: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now, index=True)

    user: Mapped[User] = relationship(back_populates="attempts")


class ChapterProgress(Base):
    """One row per (user, chapter, tab) marking a studied sub-menu."""

    __tablename__ = "chapter_progress"
    __table_args__ = (UniqueConstraint("user_id", "chapter", "tab", name="uq_user_chapter_tab"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    chapter: Mapped[int] = mapped_column(Integer)
    tab: Mapped[str] = mapped_column(String(20))
    completed_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    user: Mapped[User] = relationship(back_populates="chapter_progress")


# ------------------------------------------------------------ Pydantic schemas


class SignupInput(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)

    @field_validator("name")
    @classmethod
    def _strip_name(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Nama minimal 2 karakter")
        return cleaned


class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


class UserPublic(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime


class AuthResponse(BaseModel):
    token: str
    user: UserPublic


class ChapterProgressInput(BaseModel):
    chapter: int = Field(ge=1, le=50)
    tab: str

    @field_validator("tab")
    @classmethod
    def _valid_tab(cls, v: str) -> str:
        allowed = {"bunpo", "kotoba", "kanji", "kaiwa"}
        if v not in allowed:
            raise ValueError(f"tab harus salah satu dari {sorted(allowed)}")
        return v


class ChapterProgressItem(BaseModel):
    chapter: int
    tab: str
    completed_at: datetime


class ProgressSummary(BaseModel):
    studied_chapters: list[int]
    completed_chapters: list[int]  # semua 4 tab selesai
    items: list[ChapterProgressItem]
