"""Kanji stroke-order data (KanjiVG paths) served from MongoDB — seeded by seed_strokes.py."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from lib.db import db

router = APIRouter()


class StrokeData(BaseModel):
    character: str
    stroke_count: int
    strokes: list[str]  # SVG path 'd' attributes, satu per goresan, urut
    view_box: str


@router.get("/kanji/{character}/strokes", response_model=StrokeData)
async def get_strokes(character: str):
    doc = await db.kanji_strokes.find_one({"character": character}, {"_id": 0})
    if not doc:
        raise HTTPException(
            status_code=404, detail=f"Data urutan goresan untuk “{character}” belum tersedia"
        )
    return StrokeData(**doc)
