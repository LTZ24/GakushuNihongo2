"""Kartu Hafalan — tabel MySQL untuk jawaban salah + skema Pydantic v2.

Satu baris per (user, key): `key` adalah identitas soal (mis. "kanji:日") sehingga salah
berulang hanya menaikkan `wrong_count`. Tamu tidak memakai tabel ini — frontend menyimpan
kesalahan tamu di localStorage dengan bentuk data yang sama.
"""

import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, Field, field_validator
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.orm import Mapped, mapped_column

from lib.sql import Base
from models.content import RubySegment

KINDS = {"kotoba", "kanji", "bunpo", "susun"}


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Mistake(Base):
    __tablename__ = "quiz_mistakes"
    __table_args__ = (UniqueConstraint("user_id", "item_key", name="uq_user_item_key"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    item_key: Mapped[str] = mapped_column(String(160))
    kind: Mapped[str] = mapped_column(String(20))
    subtype: Mapped[str] = mapped_column(String(30))
    front_text: Mapped[str | None] = mapped_column(String(255), nullable=True)
    front_segments: Mapped[list | None] = mapped_column(JSON, nullable=True)
    back_text: Mapped[str] = mapped_column(String(255))
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    chapter: Mapped[int | None] = mapped_column(Integer, nullable=True)
    wrong_count: Mapped[int] = mapped_column(Integer, default=1)
    mastered: Mapped[bool] = mapped_column(Boolean, default=False)
    last_wrong_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class MistakeInput(BaseModel):
    item_key: str = Field(min_length=1, max_length=160)
    kind: str
    subtype: str = Field(max_length=30)
    front_text: str | None = None
    front_segments: list[RubySegment] | None = None
    back_text: str = Field(min_length=1, max_length=255)
    explanation: str | None = None
    chapter: int | None = None

    @field_validator("kind")
    @classmethod
    def _valid_kind(cls, v: str) -> str:
        if v not in KINDS:
            raise ValueError(f"kind harus salah satu dari {sorted(KINDS)}")
        return v


class FlashcardItem(BaseModel):
    item_key: str
    kind: str
    subtype: str
    front_text: str | None = None
    front_segments: list[RubySegment] | None = None
    back_text: str
    explanation: str | None = None
    chapter: int | None = None
    wrong_count: int
    mastered: bool
    last_wrong_at: datetime


class MasteredInput(BaseModel):
    item_key: str
    mastered: bool = True


class SaveResult(BaseModel):
    saved: int
