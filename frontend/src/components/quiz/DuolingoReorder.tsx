import { useState } from "react";
import { motion } from "motion/react";
import { RotateCcw } from "lucide-react";
import Furigana from "@/components/japanese/Furigana";
import { Button } from "@/components/ui/button";
import type { QuizQuestion, RubySegment } from "@/types/japanese";

const sameToken = (a: RubySegment, b: RubySegment) =>
  a.text === b.text && (a.reading ?? "") === (b.reading ?? "");

/** Duolingo-style word reordering: tap bank chips to build the sentence, tap again to remove. */
export default function DuolingoReorder({
  question,
  disabled,
  onCheck,
}: {
  question: QuizQuestion;
  disabled: boolean;
  onCheck: (chosen: RubySegment[], correct: boolean) => void;
}) {
  const blocks = question.blocks ?? [];
  const correctOrder = question.correct_order ?? [];
  const [picked, setPicked] = useState<number[]>([]);

  const available = blocks
    .map((block, index) => ({ block, index }))
    .filter(({ index }) => !picked.includes(index));

  const check = () => {
    const chosen = picked.map((i) => blocks[i]);
    const correct =
      chosen.length === correctOrder.length &&
      chosen.every((token, i) => sameToken(token, correctOrder[i]));
    onCheck(chosen, correct);
  };

  return (
    <div className="space-y-6">
      <div
        data-testid="duolingo-answer-area"
        className="min-h-24 rounded-2xl border-2 border-dashed border-border bg-secondary/40 p-3"
      >
        <div className="flex flex-wrap gap-2">
          {picked.length === 0 && (
            <p className="self-center px-2 text-sm text-muted-foreground">
              Ketuk blok kata di bawah untuk menyusun kalimat…
            </p>
          )}
          {picked.map((blockIndex, pos) => (
            <motion.button
              key={`${blockIndex}-${pos}`}
              layout
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              type="button"
              data-testid="duolingo-answer-chip"
              disabled={disabled}
              onClick={() => setPicked((p) => p.filter((_, k) => k !== pos))}
              className="rounded-xl border border-b-4 border-border bg-card px-3.5 py-2 font-jp text-lg transition-transform active:translate-y-0.5 disabled:opacity-80"
            >
              <Furigana segments={[blocks[blockIndex]]} />
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {available.map(({ block, index }) => (
          <motion.button
            key={index}
            layout
            whileHover={{ y: -2 }}
            whileTap={{ y: 2 }}
            type="button"
            data-testid="duolingo-word-chip"
            disabled={disabled}
            onClick={() => setPicked((p) => [...p, index])}
            className="rounded-xl border border-b-4 border-border bg-card px-3.5 py-2 shadow-sm transition-colors hover:border-primary/50 disabled:opacity-80"
          >
            <Furigana segments={[block]} />
          </motion.button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          data-testid="duolingo-reset-button"
          disabled={disabled || picked.length === 0}
          onClick={() => setPicked([])}
        >
          <RotateCcw className="size-4" /> Ulang
        </Button>
        <Button
          data-testid="duolingo-check-button"
          onClick={check}
          disabled={disabled || picked.length !== correctOrder.length}
        >
          Periksa
        </Button>
      </div>
    </div>
  );
}
