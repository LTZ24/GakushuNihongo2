import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SentenceLine from "@/components/japanese/SentenceLine";
import type { BunpoPoint } from "@/types/japanese";

/** Grammar formula: [Kata …] tokens become chips, particles are highlighted in crimson. */
export function RumusFormula({ rumus, className }: { rumus: string; className?: string }) {
  const parts = rumus.split(/(\[[^\]]+\])/g).filter(Boolean);
  return (
    <div
      data-testid="bunpo-rumus"
      className={cn(
        "rounded-xl border border-crimson-200 bg-[#FEF2F2] px-4 py-3 font-jp text-base font-bold leading-relaxed text-crimson-900 dark:border-crimson-900/40 dark:bg-crimson-950/25 dark:text-crimson-100",
        className,
      )}
    >
      {parts.map((part, i) =>
        part.startsWith("[") ? (
          <span
            key={i}
            className="mx-0.5 inline-block rounded-md bg-white px-2 py-0.5 text-[0.78em] font-semibold text-indigo-800 ring-1 ring-indigo-200 dark:bg-slate-800 dark:text-indigo-200 dark:ring-indigo-500/30"
          >
            {part.slice(1, -1)}
          </span>
        ) : (
          <span key={i} className="text-crimson-700 dark:text-crimson-300">
            {part}
          </span>
        ),
      )}
    </div>
  );
}

/** Inline text where [bracketed] word-type tokens render as small chips. */
export function BracketText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\[[^\]]+\])/g).filter(Boolean);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.startsWith("[") ? (
          <span
            key={i}
            className="mx-0.5 inline-block rounded bg-indigo-100 px-1.5 py-px text-[0.85em] font-semibold text-indigo-800 dark:bg-slate-800 dark:text-indigo-200"
          >
            {part.slice(1, -1)}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

export default function BunpoCard({ point }: { point: BunpoPoint }) {
  return (
    <Card className="border-border/70 shadow-sm" data-testid="bunpo-card">
      <CardHeader>
        <CardTitle className="flex items-start gap-3 text-lg leading-snug">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-jp text-base font-bold text-primary">
            文
          </span>
          {point.judul}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pola Kalimat (Rumus)
          </p>
          <RumusFormula rumus={point.rumus} />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Keterangan Jenis Kata
          </p>
          <ul className="space-y-1.5">
            {point.keterangan.map((k, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed">
                <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-primary/70" />
                <BracketText text={k} />
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[15px] leading-relaxed text-foreground/90">{point.penjelasan}</p>

        <div className="space-y-2.5 rounded-xl bg-secondary/60 p-3.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Contoh Kalimat
          </p>
          {point.contoh.map((line, i) => (
            <SentenceLine key={i} line={line} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
