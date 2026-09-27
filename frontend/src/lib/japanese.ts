// Helpers for Japanese text handling.

import type { RubySegment } from "@/types/japanese";

/** Plain surface text of a segment list (no readings) — used for speech synthesis. */
export function segmentsToText(segments: RubySegment[]): string {
  return segments.map((s) => s.text).join("");
}

/** Speak Japanese text with the browser's speech synthesis, when available. */
export function speakJapanese(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

export const QUIZ_TYPE_LABELS: Record<string, string> = {
  bunpo: "Quiz Bunpo",
  kanji: "Quiz Kanji",
  kotoba: "Quiz Kotoba",
  mix: "Quiz Campuran",
  susun: "Susun Kata",
};
