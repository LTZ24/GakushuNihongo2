import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layers, RotateCcw, Shuffle } from "lucide-react";
import { apiGet } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { KanjiDeckItem } from "@/types/japanese";

type Scope =
  | { type: "book"; value: "minna1" }
  | { type: "book"; value: "minna2" }
  | { type: "all"; value: "" }
  | { type: "chapters"; value: string };

const PRESETS: { key: string; label: string; scope: Scope }[] = [
  { key: "minna1", label: "Minna 1 (Bab 1–25)", scope: { type: "book", value: "minna1" } },
  { key: "minna2", label: "Minna 2 (Bab 26–50)", scope: { type: "book", value: "minna2" } },
  { key: "all", label: "Semua Bab", scope: { type: "all", value: "" } },
];

export default function KanjiKartu() {
  const [presetKey, setPresetKey] = useState<string>("minna1");
  const [picked, setPicked] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const scope: Scope = useMemo(
    () =>
      picked.length
        ? { type: "chapters", value: [...picked].sort((a, b) => a - b).join(",") }
        : (PRESETS.find((p) => p.key === presetKey)?.scope ?? PRESETS[0].scope),
    [picked, presetKey],
  );

  const { data: deck, isLoading } = useQuery({
    queryKey: ["kanji-deck", scope.type, scope.value],
    queryFn: () =>
      apiGet<KanjiDeckItem[]>(
        `/kanji/deck?scope_type=${scope.type}&scope_value=${encodeURIComponent(scope.value)}`,
      ),
  });

  const cards = deck ?? [];
  const card = cards[index];

  const reset = () => {
    setIndex(0);
    setFlipped(false);
  };
  const toggleChapter = (n: number) => {
    setPicked((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
    reset();
  };
  const next = () => {
    setFlipped(false);
    setIndex((i) => (cards.length ? (i + 1) % cards.length : 0));
  };
  const shuffle = () => {
    setFlipped(false);
    setIndex(cards.length ? Math.floor(Math.random() * cards.length) : 0);
  };

  return (
    <div className="mx-auto max-w-2xl animate-fade-up" data-testid="kanji-kartu-page">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        Flashcard Kanji
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight" data-testid="kanji-kartu-title">
        Hafalkan kanji per bab
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pilih cakupan, lalu ketuk kartu untuk melihat bacaan dan arti.
      </p>

      <div className="mt-4 flex flex-wrap gap-2" data-testid="kanji-scope-presets">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            data-testid={`kanji-scope-${p.key}`}
            onClick={() => {
              setPresetKey(p.key);
              setPicked([]);
              reset();
            }}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              !picked.length && presetKey === p.key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/70 text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <details className="mt-3 rounded-xl border border-border/70 bg-card/50 p-3" data-testid="kanji-custom-chapters">
        <summary className="cursor-pointer text-sm font-semibold">
          Pilih bab sendiri {picked.length > 0 && `(${picked.length} bab dipilih)`}
        </summary>
        <div className="mt-3 grid grid-cols-8 gap-1.5 sm:grid-cols-10">
          {Array.from({ length: 50 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              data-testid={`kanji-chapter-${n}`}
              onClick={() => toggleChapter(n)}
              className={cn(
                "rounded-md border py-1 text-xs font-semibold transition-colors",
                picked.includes(n)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/70 text-muted-foreground hover:text-foreground",
              )}
            >
              {n}
            </button>
          ))}
        </div>
        {picked.length > 0 && (
          <button
            type="button"
            data-testid="kanji-clear-chapters"
            onClick={() => {
              setPicked([]);
              reset();
            }}
            className="mt-3 text-xs font-semibold text-primary hover:underline"
          >
            Hapus pilihan
          </button>
        )}
      </details>

      <div className="mt-4 flex items-center justify-between">
        <Badge variant="secondary" data-testid="kanji-deck-count">
          <Layers className="size-3.5" /> {cards.length} kanji
        </Badge>
      </div>

      {isLoading && <div className="mt-4 h-60 animate-pulse rounded-3xl bg-secondary/60" />}

      {!isLoading && !card && (
        <Card className="mt-4 p-8 text-center" data-testid="kanji-deck-empty">
          <p className="font-semibold">Tidak ada kanji untuk cakupan ini</p>
        </Card>
      )}

      {card && (
        <>
          <button
            type="button"
            data-testid="kanji-card-flip"
            onClick={() => setFlipped((v) => !v)}
            className="mt-4 block w-full text-left"
          >
            <Card
              className={cn(
                "min-h-60 p-7 shadow-sm transition-shadow duration-300 hover:shadow-md",
                flipped && "border-primary/50 bg-primary/[0.04]",
              )}
            >
              <div className="flex items-center justify-between">
                <Badge variant="outline">Bab {card.chapter}</Badge>
                <span className="text-xs text-muted-foreground">
                  {card.stroke_count} goresan
                </span>
              </div>
              {flipped ? (
                <div className="mt-4" data-testid="kanji-card-back">
                  <p className="font-jp text-5xl font-bold text-center">{card.character}</p>
                  <p className="mt-4 text-center text-lg font-semibold">{card.meaning}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <p><span className="text-crimson-600 dark:text-crimson-300 font-semibold">音</span> {card.onyomi || "—"}</p>
                    <p><span className="text-teal-600 dark:text-teal-300 font-semibold">訓</span> {card.kunyomi || "—"}</p>
                  </div>
                  {card.jukugo.length > 0 && (
                    <div className="mt-3 border-t border-border/60 pt-3">
                      {card.jukugo.slice(0, 3).map((j) => (
                        <p key={j.word} className="font-jp text-sm">
                          {j.word}（{j.kana}）— {j.meaning}
                        </p>
                      ))}
                    </div>
                  )}
                  <Link
                    to={`/bab/${card.chapter}`}
                    data-testid="kanji-card-stroke-link"
                    className="mt-3 inline-block text-xs font-semibold text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Lihat urutan goresan di Bab {card.chapter} →
                  </Link>
                </div>
              ) : (
                <div className="mt-6 text-center" data-testid="kanji-card-front">
                  <p className="font-jp text-7xl font-bold">{card.character}</p>
                  <p className="mt-6 text-xs text-muted-foreground">
                    Ketuk untuk melihat bacaan &amp; arti
                  </p>
                </div>
              )}
            </Card>
          </button>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" data-testid="kanji-card-position">
              Kartu {index + 1} dari {cards.length}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={shuffle} data-testid="kanji-shuffle">
                <Shuffle className="size-4" /> Acak
              </Button>
              <Button size="sm" onClick={next} data-testid="kanji-next">
                <RotateCcw className="size-4" /> Berikutnya
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
