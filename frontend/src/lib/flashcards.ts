// Kartu Hafalan — kesalahan kuis jadi flashcard.
// User login: disimpan di MySQL lewat /api/flashcards*. Tamu: localStorage dengan bentuk
// data yang sama, jadi komponen Kartu tidak perlu tahu sumbernya.

import type { FlashcardItem, MistakeInput, QuizQuestion } from "@/types/japanese";

const GUEST_KEY = "gakushu_guest_cards";

export const KIND_LABELS: Record<string, string> = {
  kotoba: "Kotoba",
  kanji: "Kanji",
  bunpo: "Bunpo",
  susun: "Susun Kata",
};

function segmentsText(segments: { text: string }[] | null): string {
  return (segments ?? []).map((s) => s.text).join("");
}

/** Ubah soal yang dijawab salah menjadi calon kartu hafalan. */
export function mistakeFromQuestion(q: QuizQuestion, chapter: number | null): MistakeInput {
  const front = q.prompt_text ?? segmentsText(q.prompt_segments);
  const back =
    q.type === "susun"
      ? segmentsText(q.correct_order)
      : (q.options[q.answer_index] ?? "");
  return {
    item_key: `${q.subtype}:${front}`.slice(0, 160),
    kind: q.type,
    subtype: q.subtype,
    front_text: q.prompt_segments ? null : front,
    front_segments: q.prompt_segments,
    back_text: back.slice(0, 255) || "—",
    explanation: q.explanation,
    chapter,
  };
}

export function loadGuestCards(): FlashcardItem[] {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    const parsed = raw ? (JSON.parse(raw) as FlashcardItem[]) : [];
    return parsed
      .filter((c) => !c.mastered)
      .sort((a, b) => b.wrong_count - a.wrong_count);
  } catch {
    return [];
  }
}

function writeGuestCards(cards: FlashcardItem[]): void {
  localStorage.setItem(GUEST_KEY, JSON.stringify(cards.slice(0, 200)));
}

function readAll(): FlashcardItem[] {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    return raw ? (JSON.parse(raw) as FlashcardItem[]) : [];
  } catch {
    return [];
  }
}

export function saveGuestMistakes(items: MistakeInput[]): void {
  const all = readAll();
  for (const item of items) {
    const existing = all.find((c) => c.item_key === item.item_key);
    if (existing) {
      existing.wrong_count += 1;
      existing.mastered = false;
      existing.last_wrong_at = new Date().toISOString();
    } else {
      all.push({ ...item, wrong_count: 1, mastered: false, last_wrong_at: new Date().toISOString() });
    }
  }
  writeGuestCards(all);
}

export function setGuestMastered(itemKey: string, mastered: boolean): void {
  const all = readAll();
  const card = all.find((c) => c.item_key === itemKey);
  if (card) card.mastered = mastered;
  writeGuestCards(all);
}
