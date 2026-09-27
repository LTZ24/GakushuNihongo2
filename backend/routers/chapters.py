"""Chapter material endpoints — list of 50 bab + per-chapter detail with content."""

from fastapi import APIRouter, HTTPException

from lib.db import db
from lib.kanji_examples import build_word_pool, enrich_content
from models.content import ChapterContent, ChapterDetail, ChapterSummary

router = APIRouter()

BOOK_LABELS = {1: "Minna no Nihongo 1", 2: "Minna no Nihongo 2"}

# Pool kata untuk melengkapi contoh kanji (2 onyomi + 2 kunyomi). Materi bersifat statis,
# jadi cukup dibangun sekali per proses.
_word_pool: list[dict] | None = None


async def _get_word_pool() -> list[dict]:
    global _word_pool
    if _word_pool is None:
        docs = await db.chapters.find({"has_content": True}, {"_id": 0}).to_list(60)
        _word_pool = build_word_pool(docs)
    return _word_pool


def _summary(doc: dict) -> ChapterSummary:
    has_content = bool(doc.get("has_content"))
    return ChapterSummary(
        number=doc["number"],
        book=doc["book"],
        book_label=BOOK_LABELS[doc["book"]],
        title=doc["title"],
        title_translation=doc["title_translation"],
        has_content=has_content,
        is_locked=not has_content,
    )


@router.get("/chapters", response_model=list[ChapterSummary])
async def list_chapters():
    docs = await db.chapters.find({}, {"_id": 0, "content": 0}).sort("number", 1).to_list(100)
    return [_summary(d) for d in docs]


@router.get("/chapters/{number}", response_model=ChapterDetail)
async def get_chapter(number: int):
    if number < 1 or number > 50:
        raise HTTPException(status_code=404, detail=f"Bab {number} tidak ada — nomor bab 1 sampai 50")
    doc = await db.chapters.find_one({"number": number}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Bab {number} belum terdaftar di database")
    content = None
    if doc.get("content"):
        content = ChapterContent(**enrich_content(doc["content"], await _get_word_pool()))
    return ChapterDetail(**_summary(doc).model_dump(), content=content)
