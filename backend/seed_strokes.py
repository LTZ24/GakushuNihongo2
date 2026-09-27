"""Seed KanjiVG stroke-order paths into MongoDB for every kanji used by the chapters.

Data: @k1low/hanzi-writer-data-jp (KanjiVG-derived), fetched once from unpkg and cached in
Mongo so the frontend never depends on an external CDN at runtime.

Run: cd /app/backend && python seed_strokes.py   (idempotent; hanya mengambil yang belum ada)
"""

import asyncio

import httpx

from lib.db import db

CDN = "https://unpkg.com/@k1low/hanzi-writer-data-jp@latest/{char}.json"
# hanzi-writer data uses a 0..1024 grid with a flipped Y axis.
VIEW_BOX = "0 0 1024 1024"
TRANSFORM_NOTE = "scale(1, -1) translate(0, -900)"


async def _collect_characters() -> list[str]:
    chars: set[str] = set()
    async for doc in db.chapters.find({"has_content": True}, {"_id": 0, "content.kanji": 1}):
        for item in (doc.get("content") or {}).get("kanji", []):
            chars.add(item["character"])
    return sorted(chars)


async def main() -> None:
    await db.kanji_strokes.create_index("character", unique=True)
    characters = await _collect_characters()
    existing = {
        d["character"]
        async for d in db.kanji_strokes.find({}, {"_id": 0, "character": 1})
    }
    todo = [c for c in characters if c not in existing]
    print(f"kanji in chapters: {len(characters)} | already cached: {len(existing)} | fetching: {len(todo)}")

    ok, failed = 0, []
    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        for char in todo:
            try:
                res = await client.get(CDN.format(char=char))
                if res.status_code != 200:
                    failed.append((char, f"HTTP {res.status_code}"))
                    continue
                data = res.json()
                strokes = data.get("strokes") or []
                if not strokes:
                    failed.append((char, "no strokes in payload"))
                    continue
                await db.kanji_strokes.replace_one(
                    {"character": char},
                    {
                        "character": char,
                        "stroke_count": len(strokes),
                        "strokes": strokes,
                        "view_box": VIEW_BOX,
                        "transform": TRANSFORM_NOTE,
                    },
                    upsert=True,
                )
                ok += 1
            except Exception as exc:  # noqa: BLE001 - report and continue with the rest
                failed.append((char, f"{type(exc).__name__}: {exc}"))

    total = await db.kanji_strokes.count_documents({})
    print(f"stroke seed ok: fetched {ok}, cached total {total}")
    if failed:
        print("failed:", failed)


if __name__ == "__main__":
    asyncio.run(main())
