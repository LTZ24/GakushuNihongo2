"""Kartu Hafalan: catat jawaban salah lalu sajikan sebagai flashcard (butuh login).

Tamu memakai penyimpanan lokal di browser, jadi endpoint ini selalu memerlukan token.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.dialects.mysql import insert as mysql_insert
from sqlalchemy.ext.asyncio import AsyncSession

from lib.auth import current_user
from lib.sql import get_session
from models.flashcard import (
    FlashcardItem,
    MasteredInput,
    Mistake,
    MistakeInput,
    SaveResult,
    _now,
)
from models.user import User

router = APIRouter()


def as_utc(dt):
    from datetime import timezone

    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


def _to_schema(row: Mistake) -> FlashcardItem:
    return FlashcardItem(
        item_key=row.item_key,
        kind=row.kind,
        subtype=row.subtype,
        front_text=row.front_text,
        front_segments=row.front_segments,
        back_text=row.back_text,
        explanation=row.explanation,
        chapter=row.chapter,
        wrong_count=row.wrong_count,
        mastered=row.mastered,
        last_wrong_at=as_utc(row.last_wrong_at),
    )


@router.post("/flashcards/mistakes", response_model=SaveResult)
async def save_mistakes(
    items: list[MistakeInput],
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
):
    """Upsert per (user, item_key): salah lagi = wrong_count naik dan status hafal direset."""
    if len(items) > 50:
        raise HTTPException(status_code=422, detail="maksimal 50 kesalahan per pengiriman")
    for item in items:
        values = item.model_dump()
        values["front_segments"] = (
            [s.model_dump() for s in item.front_segments] if item.front_segments else None
        )
        stmt = mysql_insert(Mistake).values(user_id=user.id, wrong_count=1, mastered=False, **values)
        await session.execute(
            stmt.on_duplicate_key_update(
                wrong_count=Mistake.wrong_count + 1,
                mastered=False,
                last_wrong_at=_now(),
                back_text=stmt.inserted.back_text,
                explanation=stmt.inserted.explanation,
            )
        )
    await session.commit()
    return SaveResult(saved=len(items))


@router.get("/flashcards", response_model=list[FlashcardItem])
async def list_flashcards(
    include_mastered: bool = Query(False),
    kind: str | None = Query(None),
    limit: int = Query(60, ge=1, le=200),
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
):
    query = select(Mistake).where(Mistake.user_id == user.id)
    if not include_mastered:
        query = query.where(Mistake.mastered.is_(False))
    if kind:
        query = query.where(Mistake.kind == kind)
    rows = (
        await session.execute(
            query.order_by(Mistake.wrong_count.desc(), Mistake.last_wrong_at.desc()).limit(limit)
        )
    ).scalars().all()
    return [_to_schema(r) for r in rows]


@router.post("/flashcards/mastered", response_model=FlashcardItem)
async def set_mastered(
    input: MasteredInput,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
):
    row = (
        await session.execute(
            select(Mistake).where(
                Mistake.user_id == user.id, Mistake.item_key == input.item_key
            )
        )
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Kartu tidak ditemukan")
    row.mastered = input.mastered
    await session.commit()
    return _to_schema(row)
