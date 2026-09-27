"""Kanji stroke-order data (KanjiVG paths) served from MongoDB — seeded by seed_strokes.py."""

from fastapi import APIRouter, HTTPException
import httpx
from pydantic import BaseModel

from lib.db import db

router = APIRouter()


class StrokeData(BaseModel):
    character: str
    stroke_count: int
    strokes: list[str]  # SVG path 'd' attributes, satu per goresan, urut
    view_box: str


KANJIVG_CDN = "https://unpkg.com/@k1low/hanzi-writer-data-jp@latest/{char}.json"
VIEW_BOX = "0 0 1024 1024"
TRANSFORM_NOTE = "scale(1, -1) translate(0, -900)"


@router.get("/kanji/{character}/strokes", response_model=StrokeData)
async def get_strokes(character: str):
    # Fast path: use the MongoDB cache when available.
    doc = await db.kanji_strokes.find_one({"character": character}, {"_id": 0})
    if doc:
        return StrokeData(**doc)

    # Render Free has no persistent shell, so don't require a separate
    # seed_strokes.py job. Fetch a missing character on demand and cache it.
    if len(character) != 1:
        raise HTTPException(status_code=400, detail="character harus tepat satu karakter")

    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            res = await client.get(KANJIVG_CDN.format(char=character))
        if res.status_code != 200:
            raise HTTPException(
                status_code=404,
                detail=f"Data urutan goresan untuk “{character}” belum tersedia",
            )
        data = res.json()
        strokes = data.get("strokes") or []
        if not strokes:
            raise HTTPException(
                status_code=404,
                detail=f"Data urutan goresan untuk “{character}” belum tersedia",
            )

        doc = {
            "character": character,
            "stroke_count": len(strokes),
            "strokes": strokes,
            "view_box": VIEW_BOX,
            "transform": TRANSFORM_NOTE,
        }
        await db.kanji_strokes.replace_one(
            {"character": character}, doc, upsert=True
        )
        return StrokeData(**doc)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Gagal mengambil data urutan goresan untuk “{character}”",
        ) from exc
