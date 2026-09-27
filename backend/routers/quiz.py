"""Quiz question generation from chapter content + attempt logging + stats."""

import random
from itertools import zip_longest

from fastapi import APIRouter, HTTPException, Query

from lib.db import db
from models.content import RubySegment
from models.quiz import QuizQuestion

router = APIRouter()

QUIZ_TYPES = {"bunpo", "kanji", "kotoba", "mix", "susun"}
BOOK_RANGES = {"minna1": (1, 25), "minna2": (26, 50)}


def _chapter_numbers(scope_type: str, scope_value: str) -> list[int]:
    if scope_type == "chapter":
        try:
            n = int(scope_value)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="scope_value bab harus angka") from exc
        if n < 1 or n > 50:
            raise HTTPException(status_code=400, detail="Nomor bab harus 1 sampai 50")
        return [n]
    if scope_type == "chapters":
        try:
            nums = sorted({int(x) for x in scope_value.split(",") if x.strip()})
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="scope_value harus daftar angka dipisah koma") from exc
        nums = [n for n in nums if 1 <= n <= 50]
        if not nums:
            raise HTTPException(status_code=400, detail="Pilih minimal satu bab yang valid (1-50)")
        return nums
    if scope_type == "book":
        rng = BOOK_RANGES.get(scope_value)
        if not rng:
            raise HTTPException(status_code=400, detail="scope_value buku harus 'minna1' atau 'minna2'")
        return list(range(rng[0], rng[1] + 1))
    if scope_type == "all":
        return list(range(1, 51))
    raise HTTPException(status_code=400, detail="scope_type harus 'chapter', 'chapters', 'book', atau 'all'")


async def _load_contents(numbers: list[int]) -> list[dict]:
    docs = await db.chapters.find(
        {"number": {"$in": numbers}, "has_content": True}, {"_id": 0}
    ).to_list(60)
    return [d["content"] for d in docs if d.get("content")]


def _bunpo_questions(contents: list[dict]) -> list[QuizQuestion]:
    questions = []
    for content in contents:
        for item in content.get("quiz_bunpo", []):
            questions.append(
                QuizQuestion(
                    id=item["id"],
                    type="bunpo",
                    subtype="bunpo-particle",
                    prompt_label="Pilih partikel / pola kalimat yang tepat",
                    prompt_segments=item.get("question_segments"),
                    prompt_text=item.get("question_text"),
                    options=item["options"],
                    answer_index=item["answer_index"],
                    explanation=item["explanation"],
                    correct_segments=item.get("correct_segments"),
                    highlight_text=item.get("highlight_text"),
                    rumus=item["rumus"],
                )
            )
    return questions


def _kotoba_questions(contents: list[dict]) -> list[QuizQuestion]:
    items = [i for c in contents for i in c["kotoba"]]
    meanings = list(dict.fromkeys(i["meaning"] for i in items))
    words = list(dict.fromkeys(i["word"] for i in items))
    questions = []
    for item in items:
        distractors = [m for m in meanings if m != item["meaning"]]
        opts = [item["meaning"]] + random.sample(distractors, min(3, len(distractors)))
        random.shuffle(opts)
        questions.append(
            QuizQuestion(
                type="kotoba",
                subtype="kotoba-jp-id",
                prompt_label="Apa arti kosakata ini?",
                prompt_segments=item["segments"],
                options=opts,
                answer_index=opts.index(item["meaning"]),
                explanation=f"{item['word']}（{item['kana']}） berarti “{item['meaning']}”.",
            )
        )
        distractors = [w for w in words if w != item["word"]]
        opts = [item["word"]] + random.sample(distractors, min(3, len(distractors)))
        random.shuffle(opts)
        questions.append(
            QuizQuestion(
                type="kotoba",
                subtype="kotoba-id-jp",
                prompt_label=f"“{item['meaning']}” dalam Bahasa Jepang adalah…",
                prompt_text=item["meaning"],
                options=opts,
                answer_index=opts.index(item["word"]),
                explanation=f"{item['meaning']} = {item['word']}（{item['kana']}）.",
            )
        )
    return questions


def _kanji_questions(contents: list[dict]) -> list[QuizQuestion]:
    kanjis = [k for c in contents for k in c["kanji"]]
    readings_pool = list(dict.fromkeys(j["kana"] for k in kanjis for j in k["jukugo"]))
    meanings_pool = list(dict.fromkeys(k["meaning"] for k in kanjis))
    questions = []
    for k in kanjis:
        distractors = [m for m in meanings_pool if m != k["meaning"]]
        opts = [k["meaning"]] + random.sample(distractors, min(3, len(distractors)))
        random.shuffle(opts)
        questions.append(
            QuizQuestion(
                type="kanji",
                subtype="kanji-meaning",
                prompt_label="Apa arti kanji ini?",
                prompt_text=k["character"],
                options=opts,
                answer_index=opts.index(k["meaning"]),
                explanation=(
                    f"Kanji {k['character']} berarti {k['meaning']} — "
                    f"onyomi: {k['onyomi']}, kunyomi: {k['kunyomi']}."
                ),
            )
        )
        for j in k["jukugo"][:2]:
            distractors = [r for r in readings_pool if r != j["kana"]]
            opts = [j["kana"]] + random.sample(distractors, min(3, len(distractors)))
            random.shuffle(opts)
            questions.append(
                QuizQuestion(
                    type="kanji",
                    subtype="kanji-reading",
                    prompt_label="Bagaimana cara baca kata ini?",
                    prompt_segments=[RubySegment(text=j["word"], reading=None)],
                    options=opts,
                    answer_index=opts.index(j["kana"]),
                    explanation=f"{j['word']} dibaca {j['kana']} — artinya {j['meaning']}.",
                )
            )
    return questions


def _susun_questions(contents: list[dict]) -> list[QuizQuestion]:
    questions = []
    for content in contents:
        for item in content.get("quiz_susun", []):
            blocks = list(item["correct_order"]) + list(item.get("distractors", []))
            random.shuffle(blocks)
            questions.append(
                QuizQuestion(
                    id=item["id"],
                    type="susun",
                    subtype="susun-kata",
                    prompt_label="Susun blok kata menjadi kalimat yang benar",
                    prompt_text=item["translation"],
                    hint=item.get("hint"),
                    blocks=blocks,
                    correct_order=item["correct_order"],
                    explanation=" — ".join(seg["text"] for seg in item["correct_order"]),
                )
            )
    return questions


@router.get("/kanji/deck")
async def get_kanji_deck(
    scope_type: str = Query(...),
    scope_value: str = Query(""),
):
    """Flashcard kanji dari materi bab — untuk belajar, terpisah dari kartu 'sering salah'."""
    numbers = _chapter_numbers(scope_type, scope_value)
    docs = await db.chapters.find(
        {"number": {"$in": numbers}, "has_content": True}, {"_id": 0}
    ).to_list(60)
    docs.sort(key=lambda d: d["number"])
    deck = []
    seen: set[str] = set()
    for doc in docs:
        content = doc.get("content") or {}
        for k in content.get("kanji", []):
            ch = k["character"]
            if ch in seen:
                continue
            seen.add(ch)
            deck.append(
                {
                    "character": ch,
                    "onyomi": k["onyomi"],
                    "kunyomi": k["kunyomi"],
                    "meaning": k["meaning"],
                    "stroke_count": k["stroke_count"],
                    "jukugo": [
                        {"word": j["word"], "kana": j["kana"], "meaning": j["meaning"]}
                        for j in k.get("jukugo", [])
                    ],
                    "chapter": doc["number"],
                }
            )
    if not deck:
        raise HTTPException(status_code=404, detail="Belum ada kanji untuk cakupan ini")
    return deck


@router.get("/quiz/questions")
async def get_quiz_questions(
    quiz_type: str = Query(...),
    scope_type: str = Query(...),
    scope_value: str = Query(...),
    count: int = Query(10, ge=1, le=20),
):
    if quiz_type not in QUIZ_TYPES:
        raise HTTPException(status_code=400, detail=f"quiz_type harus salah satu dari {sorted(QUIZ_TYPES)}")
    contents = await _load_contents(_chapter_numbers(scope_type, scope_value))
    if not contents:
        raise HTTPException(
            status_code=404,
            detail="Materi untuk cakupan ini belum tersedia",
        )
    if quiz_type == "bunpo":
        pool = _bunpo_questions(contents)
    elif quiz_type == "kotoba":
        pool = _kotoba_questions(contents)
    elif quiz_type == "kanji":
        pool = _kanji_questions(contents)
    elif quiz_type == "susun":
        pool = _susun_questions(contents)
    else:  # mix — round-robin bunpo/kotoba/kanji so every mode shows up
        pools = [_bunpo_questions(contents), _kotoba_questions(contents), _kanji_questions(contents)]
        for p in pools:
            random.shuffle(p)
        pool = [q for group in zip_longest(*pools) for q in group if q is not None]
    random.shuffle(pool)
    return pool[:count]
