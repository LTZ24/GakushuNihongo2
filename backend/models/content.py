"""Pydantic v2 models for Minna no Nihongo chapter content."""

import uuid

from pydantic import BaseModel, Field


def _uuid() -> str:
    return str(uuid.uuid4())


class RubySegment(BaseModel):
    """One span of Japanese text; `reading` is the furigana rendered above it (None = plain text)."""

    text: str
    reading: str | None = None


class ExampleLine(BaseModel):
    segments: list[RubySegment]
    translation: str


class KotobaItem(BaseModel):
    id: str = Field(default_factory=_uuid)
    word: str
    kana: str
    romaji: str
    meaning: str
    word_type: str
    segments: list[RubySegment]
    example: ExampleLine


class JukugoItem(BaseModel):
    word: str
    kana: str
    meaning: str
    segments: list[RubySegment]


class KanjiExample(BaseModel):
    """Contoh kata pemakaian kanji; `reading_type` = "on" (onyomi) atau "kun" (kunyomi)."""

    word: str
    kana: str
    meaning: str
    segments: list[RubySegment]
    reading_type: str


class KanjiItem(BaseModel):
    id: str = Field(default_factory=_uuid)
    character: str
    onyomi: str
    kunyomi: str
    meaning: str
    stroke_count: int
    jukugo: list[JukugoItem]
    examples: list[KanjiExample] = []


class BunpoPoint(BaseModel):
    id: str = Field(default_factory=_uuid)
    judul: str
    rumus: str
    keterangan: list[str]
    penjelasan: str
    contoh: list[ExampleLine]


class KaiwaLine(BaseModel):
    speaker: str
    speaker_reading: str
    segments: list[RubySegment]
    translation: str


class Kaiwa(BaseModel):
    judul: str
    latar: str
    dialog: list[KaiwaLine]


class QuizBunpoItem(BaseModel):
    id: str = Field(default_factory=_uuid)
    question_segments: list[RubySegment] | None = None
    question_text: str | None = None
    options: list[str]
    answer_index: int
    correct_segments: list[RubySegment] | None = None
    highlight_text: str | None = None
    rumus: str
    explanation: str


class QuizSusunItem(BaseModel):
    id: str = Field(default_factory=_uuid)
    translation: str
    hint: str | None = None
    correct_order: list[RubySegment]
    distractors: list[RubySegment] = []


class ChapterContent(BaseModel):
    bunpo: list[BunpoPoint]
    kotoba: list[KotobaItem]
    kanji: list[KanjiItem]
    kaiwa: Kaiwa
    quiz_bunpo: list[QuizBunpoItem]
    quiz_susun: list[QuizSusunItem]


class ChapterSummary(BaseModel):
    number: int
    book: int
    book_label: str
    title: str
    title_translation: str
    has_content: bool
    is_locked: bool


class ChapterDetail(ChapterSummary):
    content: ChapterContent | None = None
