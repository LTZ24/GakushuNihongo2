"""Per-user progress: quiz attempts, stats, and studied-chapter tracking (MySQL)."""

from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.dialects.mysql import insert as mysql_insert
from sqlalchemy.ext.asyncio import AsyncSession

from lib.auth import current_user
from lib.sql import get_session
from models.quiz import QuizAttempt, QuizAttemptCreate, QuizStats
from models.user import (
    ChapterProgressInput,
    ChapterProgressItem,
    ProgressSummary,
    User,
)
from models.user import Attempt, ChapterProgress

router = APIRouter()

TABS = ("bunpo", "kotoba", "kanji", "kaiwa")


def _as_utc(dt: datetime) -> datetime:
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


def _to_schema(row: Attempt) -> QuizAttempt:
    return QuizAttempt(
        id=row.id,
        quiz_type=row.quiz_type,
        scope_type=row.scope_type,
        scope_value=row.scope_value,
        scope_label=row.scope_label,
        score=row.score,
        total=row.total,
        percentage=row.percentage,
        created_at=_as_utc(row.created_at),
    )


@router.post("/quiz/attempts", response_model=QuizAttempt)
async def create_attempt(
    input: QuizAttemptCreate,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
):
    if input.total <= 0:
        raise HTTPException(status_code=422, detail="total soal harus lebih dari 0")
    if input.score < 0 or input.score > input.total:
        raise HTTPException(status_code=422, detail="score harus di antara 0 dan total")
    row = Attempt(
        user_id=user.id,
        **input.model_dump(),
        percentage=round(input.score / input.total * 100),
    )
    session.add(row)
    await session.commit()
    return _to_schema(row)


@router.get("/quiz/attempts", response_model=list[QuizAttempt])
async def list_attempts(
    limit: int = Query(10, ge=1, le=50),
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
):
    rows = (
        await session.execute(
            select(Attempt)
            .where(Attempt.user_id == user.id)
            .order_by(Attempt.created_at.desc())
            .limit(limit)
        )
    ).scalars().all()
    return [_to_schema(r) for r in rows]


@router.get("/quiz/stats", response_model=QuizStats)
async def get_stats(
    user: User = Depends(current_user), session: AsyncSession = Depends(get_session)
):
    rows = (
        await session.execute(
            select(Attempt.percentage, Attempt.created_at).where(Attempt.user_id == user.id)
        )
    ).all()
    if not rows:
        return QuizStats(total_sessions=0, average_percentage=0, best_percentage=0, streak_days=0)
    percentages = [r[0] for r in rows]
    dates = sorted({_as_utc(r[1]).date() for r in rows}, reverse=True)
    today = datetime.now(timezone.utc).date()
    streak = 0
    if dates and dates[0] in (today, today - timedelta(days=1)):
        streak = 1
        for prev, cur in zip(dates, dates[1:]):
            if (prev - cur).days == 1:
                streak += 1
            else:
                break
    return QuizStats(
        total_sessions=len(rows),
        average_percentage=round(sum(percentages) / len(percentages)),
        best_percentage=max(percentages),
        streak_days=streak,
    )


@router.post("/progress/chapters", response_model=ChapterProgressItem)
async def mark_chapter_tab(
    input: ChapterProgressInput,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
):
    """Idempotent upsert — membuka tab yang sama dua kali tidak menduplikasi baris."""
    stmt = mysql_insert(ChapterProgress).values(
        user_id=user.id, chapter=input.chapter, tab=input.tab
    )
    await session.execute(stmt.on_duplicate_key_update(tab=stmt.inserted.tab))
    await session.commit()
    row = (
        await session.execute(
            select(ChapterProgress).where(
                ChapterProgress.user_id == user.id,
                ChapterProgress.chapter == input.chapter,
                ChapterProgress.tab == input.tab,
            )
        )
    ).scalar_one()
    return ChapterProgressItem(
        chapter=row.chapter, tab=row.tab, completed_at=_as_utc(row.completed_at)
    )


@router.get("/progress/chapters", response_model=ProgressSummary)
async def get_progress(
    user: User = Depends(current_user), session: AsyncSession = Depends(get_session)
):
    rows = (
        await session.execute(
            select(ChapterProgress).where(ChapterProgress.user_id == user.id)
        )
    ).scalars().all()
    by_chapter: dict[int, set[str]] = defaultdict(set)
    for row in rows:
        by_chapter[row.chapter].add(row.tab)
    return ProgressSummary(
        studied_chapters=sorted(by_chapter),
        completed_chapters=sorted(c for c, tabs in by_chapter.items() if set(TABS) <= tabs),
        items=[
            ChapterProgressItem(chapter=r.chapter, tab=r.tab, completed_at=_as_utc(r.completed_at))
            for r in rows
        ],
    )
