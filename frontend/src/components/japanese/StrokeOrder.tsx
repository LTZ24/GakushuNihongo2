import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pause, Play, RotateCcw } from "lucide-react";
import { apiGet } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { StrokeData } from "@/types/japanese";

const STROKE_MS = 750; // durasi satu goresan

/**
 * Animasi urutan goresan kanji dari data KanjiVG (path SVG) yang di-cache di backend.
 * Setiap goresan digambar berurutan dengan teknik stroke-dasharray, tanpa library luar.
 */
export default function StrokeOrder({ character }: { character: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["strokes", character],
    queryFn: () => apiGet<StrokeData>(`/kanji/${encodeURIComponent(character)}/strokes`),
    staleTime: Infinity,
    retry: false,
  });

  const total = data?.strokes.length ?? 0;
  const [drawn, setDrawn] = useState(0); // berapa goresan yang sudah tergambar penuh
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  // Jalankan animasi goresan satu per satu selama `playing`.
  useEffect(() => {
    if (!playing || total === 0) return;
    if (drawn >= total) {
      setPlaying(false);
      return;
    }
    timer.current = window.setTimeout(() => setDrawn((d) => d + 1), STROKE_MS);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [playing, drawn, total]);

  const play = () => {
    if (drawn >= total) setDrawn(0);
    setPlaying(true);
  };

  const reset = () => {
    setPlaying(false);
    setDrawn(0);
  };

  const strokes = useMemo(() => data?.strokes ?? [], [data]);

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-xl bg-secondary/60" data-testid="stroke-loading" />;
  }
  if (isError || !data) {
    return (
      <p className="text-xs text-muted-foreground" data-testid="stroke-unavailable">
        Data urutan goresan belum tersedia untuk kanji ini.
      </p>
    );
  }

  return (
    <div data-testid="stroke-order">
      <div className="relative mx-auto aspect-square w-40 rounded-xl border border-border bg-card">
        {/* garis bantu tengah */}
        <svg viewBox="0 0 1024 1024" className="absolute inset-0 size-full">
          <line x1="512" y1="0" x2="512" y2="1024" className="stroke-border" strokeDasharray="14 14" />
          <line x1="0" y1="512" x2="1024" y2="512" className="stroke-border" strokeDasharray="14 14" />
        </svg>
        <svg viewBox="0 0 1024 1024" className="absolute inset-0 size-full">
          {/* data hanzi-writer memakai sumbu Y terbalik */}
          <g transform="scale(1, -1) translate(0, -900)">
            {strokes.map((d, i) => {
              const state = i < drawn ? "done" : i === drawn && playing ? "drawing" : "pending";
              return (
                <path
                  key={i}
                  d={d}
                  className={cn(
                    state === "pending" ? "fill-muted-foreground/20" : "fill-foreground",
                    state === "done" && i === drawn - 1 && "fill-primary",
                  )}
                  style={
                    state === "drawing"
                      ? {
                          fill: "var(--color-primary)",
                          opacity: 0,
                          animation: `stroke-appear ${STROKE_MS}ms ease-out forwards`,
                        }
                      : undefined
                  }
                />
              );
            })}
          </g>
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          type="button"
          data-testid="stroke-play-button"
          onClick={() => (playing ? setPlaying(false) : play())}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary/60 hover:text-primary"
        >
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {playing ? "Jeda" : drawn >= total && total > 0 ? "Ulangi" : "Putar"}
        </button>
        <button
          type="button"
          data-testid="stroke-reset-button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary/60 hover:text-primary"
        >
          <RotateCcw className="size-3.5" /> Reset
        </button>
        <span className="text-xs text-muted-foreground" data-testid="stroke-counter">
          {Math.min(drawn, total)}/{total} goresan
        </span>
      </div>

      <div className="mt-2 flex flex-wrap justify-center gap-1">
        {strokes.map((_, i) => (
          <button
            key={i}
            type="button"
            data-testid="stroke-step-dot"
            aria-label={`Tampilkan sampai goresan ${i + 1}`}
            onClick={() => {
              setPlaying(false);
              setDrawn(i + 1);
            }}
            className={cn(
              "size-5 rounded-md text-[10px] font-bold transition-colors",
              i < drawn ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
