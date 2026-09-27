import { Volume2 } from "lucide-react";
import Furigana from "@/components/japanese/Furigana";
import { segmentsToText, speakJapanese } from "@/lib/japanese";
import type { Kaiwa } from "@/types/japanese";

/** Dialogue player: scene card, per-line furigana script with translation, full translation. */
export default function KaiwaSection({ kaiwa }: { kaiwa: Kaiwa }) {
  return (
    <div className="space-y-4" data-testid="kaiwa-section">
      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <h3 className="font-semibold">{kaiwa.judul}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{kaiwa.latar}</p>
      </div>

      <div className="space-y-3">
        {kaiwa.dialog.map((line, i) => (
          <div
            key={i}
            data-testid="kaiwa-line"
            className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-primary">
                <span className="font-jp text-sm">{line.speaker}</span>
                <span className="ml-1 font-normal text-muted-foreground">
                  · {line.speaker_reading}
                </span>
              </p>
              <button
                type="button"
                data-testid="speak-button"
                aria-label="Dengarkan kalimat"
                onClick={() => speakJapanese(segmentsToText(line.segments))}
                className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
              >
                <Volume2 className="size-4" />
              </button>
            </div>
            <Furigana segments={line.segments} className="mt-2 block text-xl" />
            <p className="mt-1 text-sm italic leading-snug text-muted-foreground">
              {line.translation}
            </p>
          </div>
        ))}
      </div>

      <details className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm" data-testid="kaiwa-full-translation">
        <summary className="cursor-pointer text-sm font-semibold">
          Terjemahan Dialog Utuh (Bahasa Indonesia)
        </summary>
        <div className="mt-3 space-y-2">
          {kaiwa.dialog.map((line, i) => (
            <p key={i} className="text-sm leading-relaxed text-foreground/90">
              <span className="font-semibold">{line.speaker_reading}:</span> {line.translation}
            </p>
          ))}
        </div>
      </details>
    </div>
  );
}
