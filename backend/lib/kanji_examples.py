"""Lengkapi setiap kanji dengan 4 contoh kata: 2 bacaan ONYOMI + 2 bacaan KUNYOMI.

Sumber contoh, berurutan:
1. `jukugo` yang sudah diauthor di seed bab,
2. kosakata (`kotoba`) dari seluruh bab yang memuat kanji tersebut,
3. tabel cadangan kata umum (`lib/kanji_fallback.py`) agar kuota 2+2 selalu penuh.

Klasifikasi bacaan memakai heuristik: kata yang seluruhnya kanji (2+ karakter) dibaca
onyomi; kata bercampur kana (okurigana) dibaca kunyomi; kata satu kanji ditentukan dengan
membandingkan kana-nya terhadap daftar kunyomi/onyomi kanji itu.
"""

import re

from lib.kanji_fallback import FALLBACK_EXAMPLES

_KANJI_RE = re.compile(r"[\u4e00-\u9fff]")
_KANA_RE = re.compile(r"[\u3040-\u30ff]")
ON, KUN = "on", "kun"


def kata_to_hira(text: str) -> str:
    return "".join(
        chr(ord(ch) - 0x60) if "\u30a1" <= ch <= "\u30f6" else ch for ch in text
    )


def _readings(raw: str) -> list[str]:
    return [kata_to_hira(r.strip()) for r in re.split(r"[・,、/]", raw or "") if r.strip()]


def _segments(word: str, kana: str) -> list[dict]:
    return [{"text": word, "reading": kana if _KANJI_RE.search(word) else None}]


def classify(word: str, kana: str, onyomi: str, kunyomi: str, character: str = "") -> str:
    """Tentukan apakah kanji dibaca onyomi atau kunyomi di dalam `word`."""
    # 1) kanji ada di awal kata → cocokkan kana dengan daftar bacaannya
    if character and word.startswith(character):
        for r in _readings(kunyomi):
            base = r.split("(")[0]
            if base and kana.startswith(base):
                return KUN
        for r in _readings(onyomi):
            if r and kana.startswith(r):
                return ON
    # 2) heuristik bentuk kata
    kanji_count = len(_KANJI_RE.findall(word))
    has_kana = bool(_KANA_RE.search(word))
    if kanji_count >= 2 and not has_kana:
        return ON
    if has_kana and kanji_count >= 1:
        return KUN
    return ON if kanji_count >= 2 else KUN


def build_word_pool(chapter_docs: list[dict]) -> list[dict]:
    """Kumpulkan kandidat contoh (kotoba + jukugo) dari seluruh bab, unik per kata."""
    pool: dict[str, dict] = {}
    for doc in chapter_docs:
        content = doc.get("content") or {}
        for item in content.get("kotoba", []):
            if _KANJI_RE.search(item["word"]):
                pool.setdefault(
                    item["word"],
                    {
                        "word": item["word"],
                        "kana": item["kana"],
                        "meaning": item["meaning"],
                        "segments": item.get("segments") or _segments(item["word"], item["kana"]),
                    },
                )
        for k in content.get("kanji", []):
            for j in k.get("jukugo", []):
                pool.setdefault(
                    j["word"],
                    {
                        "word": j["word"],
                        "kana": j["kana"],
                        "meaning": j["meaning"],
                        "segments": j.get("segments") or _segments(j["word"], j["kana"]),
                    },
                )
    return list(pool.values())


def _candidates(character: str, sources: list[dict], onyomi: str, kunyomi: str) -> dict[str, list[dict]]:
    buckets: dict[str, list[dict]] = {ON: [], KUN: []}
    seen: set[str] = set()
    for item in sources:
        if character not in item["word"] or item["word"] in seen:
            continue
        seen.add(item["word"])
        bucket = classify(item["word"], item["kana"], onyomi, kunyomi, character)
        buckets[bucket].append(
            {
                "word": item["word"],
                "kana": item["kana"],
                "meaning": item["meaning"],
                "segments": item.get("segments") or _segments(item["word"], item["kana"]),
                "reading_type": bucket,
            }
        )
    return buckets


def enrich_kanji(kanji: dict, pool: list[dict]) -> dict:
    """Tambahkan field `examples` (2 onyomi + 2 kunyomi) pada satu item kanji."""
    char = kanji["character"]
    onyomi, kunyomi = kanji.get("onyomi", ""), kanji.get("kunyomi", "")
    sources = list(kanji.get("jukugo", [])) + pool + FALLBACK_EXAMPLES.get(char, [])
    buckets = _candidates(char, sources, onyomi, kunyomi)
    examples = buckets[ON][:2] + buckets[KUN][:2]
    # kuota belum penuh (kanji tanpa kandidat kunyomi lazim, mis. 曜) → isi dari bucket lain
    if len(examples) < 4:
        extra = [e for e in buckets[ON][2:] + buckets[KUN][2:] if e not in examples]
        examples += extra[: 4 - len(examples)]
    return {**kanji, "examples": examples}


def enrich_content(content: dict, pool: list[dict]) -> dict:
    return {**content, "kanji": [enrich_kanji(k, pool) for k in content.get("kanji", [])]}
