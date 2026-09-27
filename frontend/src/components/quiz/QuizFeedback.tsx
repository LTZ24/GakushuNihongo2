import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import Furigana from "@/components/japanese/Furigana";
import { RumusFormula } from "@/components/japanese/BunpoCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QuizQuestion, RubySegment } from "@/types/japanese";

/** Correct sentence with the key particle/pattern highlighted in a crimson chip. */
function HighlightedSentence({
  segments,
  highlight,
}: {
  segments: RubySegment[];
  highlight: string | null;
}) {
  return (
    <p className="font-jp text-xl leading-loose">
      {segments.map((seg, i) => {
        if (highlight && seg.text === highlight) {
          return (
            <span
              key={i}
              data-testid="feedback-highlight"
              className="mx-0.5 inline-block animate-pop rounded-md bg-crimson-600 px-1.5 font-bold text-white"
            >
              {seg.reading ? (
                <ruby>
                  {seg.text}
                  <rt className="text-white/85">{seg.reading}</rt>
                </ruby>
              ) : (
                seg.text
              )}
            </span>
          );
        }
        return seg.reading ? (
          <ruby key={i}>
            {seg.text}
            <rt>{seg.reading}</rt>
          </ruby>
        ) : (
          <span key={i}>{seg.text}</span>
        );
      })}
    </p>
  );
}

/** Slide-up pedagogical feedback sheet — rich breakdown for Bunpo, sentence reveal for Susun. */
export default function QuizFeedback({
  question,
  correct,
  isLast,
  onNext,
}: {
  question: QuizQuestion;
  correct: boolean;
  isLast: boolean;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ y: 48, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed inset-x-0 bottom-0 z-50 pb-16 md:pb-6"
      data-testid="quiz-feedback-sheet"
    >
      <div
        className={cn(
          "mx-auto max-w-2xl rounded-t-3xl border-t-4 bg-card p-5 shadow-2xl md:rounded-3xl md:border",
          correct ? "border-matcha-500" : "border-crimson-500",
        )}
      >
        <div className="flex items-center gap-2">
          {correct ? (
            <CheckCircle2 className="size-6 shrink-0 text-matcha-600" />
          ) : (
            <XCircle className="size-6 shrink-0 text-crimson-600" />
          )}
          <p
            data-testid="feedback-verdict"
            className={cn(
              "text-lg font-bold",
              correct ? "text-matcha-700 dark:text-matcha-300" : "text-crimson-700 dark:text-crimson-300",
            )}
          >
            {correct ? "Benar!" : "Belum tepat"}
          </p>
        </div>

        {!correct && question.type !== "susun" && question.answer_index >= 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            Jawaban yang benar:{" "}
            <span className="font-jp font-semibold text-foreground">
              {question.options[question.answer_index]}
            </span>
          </p>
        )}

        {question.type === "bunpo" && (
          <div
            className="mt-3 space-y-3 rounded-2xl bg-secondary/60 p-4"
            data-testid="feedback-bunpo-breakdown"
          >
            {question.correct_segments && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Kalimat yang benar
                </p>
                <HighlightedSentence
                  segments={question.correct_segments}
                  highlight={question.highlight_text}
                />
              </div>
            )}
            {question.rumus && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Rumus pola
                </p>
                <RumusFormula rumus={question.rumus} />
              </div>
            )}
          </div>
        )}

        {question.type === "susun" && question.correct_order && (
          <div className="mt-3 rounded-2xl bg-secondary/60 p-4" data-testid="feedback-susun-answer">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Kalimat yang benar
            </p>
            <Furigana segments={question.correct_order} className="text-xl" />
          </div>
        )}

        <p className="mt-3 text-sm leading-relaxed text-foreground/90" data-testid="feedback-explanation">
          {question.explanation}
        </p>

        <Button onClick={onNext} data-testid="quiz-next-button" className="mt-4 w-full">
          {isLast ? "Lihat Hasil" : "Lanjut"}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </motion.div>
  );
}
