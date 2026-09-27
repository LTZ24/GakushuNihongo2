// Hand-written mirrors of the Pydantic models in backend/models/content.py + backend/models/quiz.py.
// Nothing infers across the Python↔TS boundary — keep both sides in sync in the same edit.

export interface RubySegment {
  text: string;
  reading: string | null;
}

export interface ExampleLine {
  segments: RubySegment[];
  translation: string;
}

export interface KotobaItem {
  id: string;
  word: string;
  kana: string;
  romaji: string;
  meaning: string;
  word_type: string;
  segments: RubySegment[];
  example: ExampleLine;
}

export interface JukugoItem {
  word: string;
  kana: string;
  meaning: string;
  segments: RubySegment[];
}

export interface KanjiExample {
  word: string;
  kana: string;
  meaning: string;
  segments: RubySegment[];
  reading_type: "on" | "kun";
}

export interface KanjiItem {
  id: string;
  character: string;
  onyomi: string;
  kunyomi: string;
  meaning: string;
  stroke_count: number;
  jukugo: JukugoItem[];
  examples: KanjiExample[];
}

export interface BunpoPoint {
  id: string;
  judul: string;
  rumus: string;
  keterangan: string[];
  penjelasan: string;
  contoh: ExampleLine[];
}

export interface KaiwaLine {
  speaker: string;
  speaker_reading: string;
  segments: RubySegment[];
  translation: string;
}

export interface Kaiwa {
  judul: string;
  latar: string;
  dialog: KaiwaLine[];
}

export interface QuizBunpoItem {
  id: string;
  question_segments: RubySegment[] | null;
  question_text: string | null;
  options: string[];
  answer_index: number;
  correct_segments: RubySegment[] | null;
  highlight_text: string | null;
  rumus: string;
  explanation: string;
}

export interface QuizSusunItem {
  id: string;
  translation: string;
  hint: string | null;
  correct_order: RubySegment[];
  distractors: RubySegment[];
}

export interface ChapterContent {
  bunpo: BunpoPoint[];
  kotoba: KotobaItem[];
  kanji: KanjiItem[];
  kaiwa: Kaiwa;
  quiz_bunpo: QuizBunpoItem[];
  quiz_susun: QuizSusunItem[];
}

export interface ChapterSummary {
  number: number;
  book: number;
  book_label: string;
  title: string;
  title_translation: string;
  has_content: boolean;
  is_locked: boolean;
}

export interface ChapterDetail extends ChapterSummary {
  content: ChapterContent | null;
}

export type QuizType = "bunpo" | "kanji" | "kotoba" | "mix" | "susun";

export interface QuizQuestion {
  id: string;
  type: "bunpo" | "kanji" | "kotoba" | "susun";
  subtype: string; // bunpo-particle | kanji-reading | kanji-meaning | kotoba-jp-id | kotoba-id-jp | susun-kata
  prompt_label: string;
  prompt_segments: RubySegment[] | null;
  prompt_text: string | null;
  options: string[];
  answer_index: number;
  explanation: string;
  correct_segments: RubySegment[] | null;
  highlight_text: string | null;
  rumus: string | null;
  translation: string | null;
  hint: string | null;
  blocks: RubySegment[] | null;
  correct_order: RubySegment[] | null;
}

export interface QuizAttempt {
  id: string;
  quiz_type: string;
  scope_type: string;
  scope_value: string;
  scope_label: string;
  score: number;
  total: number;
  percentage: number;
  created_at: string;
}

export interface QuizStats {
  total_sessions: number;
  average_percentage: number;
  best_percentage: number;
  streak_days: number;
}

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: UserPublic;
}

export interface StrokeData {
  character: string;
  stroke_count: number;
  strokes: string[]; // SVG path 'd', satu per goresan, berurutan
  view_box: string;
}

export interface ChapterProgressItem {
  chapter: number;
  tab: string;
  completed_at: string;
}

export interface ProgressSummary {
  studied_chapters: number[];
  completed_chapters: number[];
  items: ChapterProgressItem[];
}

export interface MistakeInput {
  item_key: string;
  kind: string;
  subtype: string;
  front_text: string | null;
  front_segments: RubySegment[] | null;
  back_text: string;
  explanation: string | null;
  chapter: number | null;
}

export interface FlashcardItem extends MistakeInput {
  wrong_count: number;
  mastered: boolean;
  last_wrong_at: string;
}

export interface SaveResult {
  saved: number;
}

export interface KanjiDeckItem {
  character: string;
  onyomi: string;
  kunyomi: string;
  meaning: string;
  stroke_count: number;
  jukugo: JukugoItem[];
  chapter: number;
}
