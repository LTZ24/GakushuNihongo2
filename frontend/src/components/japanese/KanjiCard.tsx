import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import Furigana from "@/components/japanese/Furigana";
import StrokeOrder from "@/components/japanese/StrokeOrder";
import { PenLine } from "lucide-react";
import type { KanjiExample, KanjiItem } from "@/types/japanese";

function ExampleRow({ example }: { example: KanjiExample }) {
  return (
    <div
      data-testid="kanji-example"
      className="flex items-baseline justify-between gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-amber-100/60 dark:hover:bg-amber-500/10"
    >
      <Furigana segments={example.segments} className="text-xl font-medium" />
      <span className="text-right text-xs text-amber-900/80 dark:text-amber-200/70">
        {example.meaning}
      </span>
    </div>
  );
}

export default function KanjiCard({ kanji }: { kanji: KanjiItem }) {
  const [showStrokes, setShowStrokes] = useState(false);
  const onExamples = kanji.examples.filter((e) => e.reading_type === "on");
  const kunExamples = kanji.examples.filter((e) => e.reading_type === "kun");
  return (
    <div
      data-testid="kanji-card"
      className="rounded-2xl border border-amber-200/70 bg-[#FFFBEB] p-5 shadow-sm dark:border-amber-500/25 dark:bg-amber-500/[0.06]"
    >
      <div className="flex items-start gap-4">
        <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-white shadow-inner dark:bg-white/10">
          <span
            data-testid="kanji-character"
            className="font-jp text-5xl font-semibold text-sumi-900 dark:text-amber-50"
          >
            {kanji.character}
          </span>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-sm font-semibold">{kanji.meaning}</p>
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
            Jumlah goresan: {kanji.stroke_count}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant="outline"
              data-testid="kanji-onyomi"
              className="border-crimson-300 font-jp text-crimson-700 dark:border-crimson-700 dark:text-crimson-300"
            >
              音 {kanji.onyomi}
            </Badge>
            <Badge
              variant="outline"
              data-testid="kanji-kunyomi"
              className="border-matcha-500/50 font-jp text-matcha-700 dark:border-matcha-700 dark:text-matcha-300"
            >
              訓 {kanji.kunyomi}
            </Badge>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2 border-t border-amber-200/70 pt-3 dark:border-amber-500/20">
        <button
          type="button"
          data-testid="stroke-toggle-button"
          onClick={() => setShowStrokes((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-900/60"
        >
          <PenLine className="size-3.5" />
          {showStrokes ? "Sembunyikan urutan goresan" : "Lihat urutan goresan"}
        </button>
        {showStrokes && (
          <div className="pt-2">
            <StrokeOrder character={kanji.character} />
          </div>
        )}
      </div>

      <div
        className="mt-4 grid gap-4 border-t border-amber-200/70 pt-3 sm:grid-cols-2 dark:border-amber-500/20"
        data-testid="kanji-examples"
      >
        <div data-testid="kanji-examples-on">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-crimson-700 dark:text-crimson-300">
            音読み · Contoh Onyomi
          </p>
          {onExamples.length ? (
            onExamples.map((e) => <ExampleRow key={e.word} example={e} />)
          ) : (
            <p className="px-2 text-xs text-muted-foreground">Tidak ada contoh onyomi umum.</p>
          )}
        </div>
        <div data-testid="kanji-examples-kun">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-matcha-700 dark:text-matcha-300">
            訓読み · Contoh Kunyomi
          </p>
          {kunExamples.length ? (
            kunExamples.map((e) => <ExampleRow key={e.word} example={e} />)
          ) : (
            <p className="px-2 text-xs text-muted-foreground">Tidak ada contoh kunyomi umum.</p>
          )}
        </div>
      </div>
    </div>
  );
}
