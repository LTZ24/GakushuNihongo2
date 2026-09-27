"""Quiz question + attempt models."""

import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, Field

from models.content import RubySegment


def _uuid() -> str:
    return str(uuid.uuid4())


class QuizQuestion(BaseModel):
    """One quiz item. Flat model covering all 5 quiz modes (optional fields per mode)."""

    id: str = Field(default_factory=_uuid)
    type: str  # bunpo | kanji | kotoba | susun
    subtype: str  # bunpo-particle | kanji-reading | kanji-meaning | kotoba-jp-id | kotoba-id-jp | susun-kata
    prompt_label: str
    prompt_segments: list[RubySegment] | None = None
    prompt_text: str | None = None
    options: list[str] = []
    answer_index: int = -1
    explanation: str = ""
    correct_segments: list[RubySegment] | None = None
    highlight_text: str | None = None
    rumus: str | None = None
    translation: str | None = None
    hint: str | None = None
    blocks: list[RubySegment] | None = None
    correct_order: list[RubySegment] | None = None


class QuizAttemptCreate(BaseModel):
    quiz_type: str
    scope_type: str  # chapter | book
    scope_value: str  # "1" | "minna1" | "minna2"
    scope_label: str
    score: int
    total: int


class QuizAttempt(BaseModel):
    id: str = Field(default_factory=_uuid)
    quiz_type: str
    scope_type: str
    scope_value: str
    scope_label: str
    score: int
    total: int
    percentage: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class QuizStats(BaseModel):
    total_sessions: int
    average_percentage: int
    best_percentage: int
    streak_days: int
