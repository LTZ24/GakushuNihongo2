import { cn } from "@/lib/utils";
import { Volume2 } from "lucide-react";
import Furigana from "@/components/japanese/Furigana";
import { segmentsToText, speakJapanese } from "@/lib/japanese";
import type { ExampleLine } from "@/types/japanese";

/** One example sentence: furigana line, Indonesian translation, and a speak button. */
export default function SentenceLine({
  line,
  className,
  jpClassName,
}: {
  line: ExampleLine;
  className?: string;
  jpClassName?: string;
}) {
  return (
    <div className={cn("group flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <Furigana segments={line.segments} className={cn("text-lg md:text-xl", jpClassName)} />
        <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{line.translation}</p>
      </div>
      <button
        type="button"
        data-testid="speak-button"
        aria-label="Dengarkan pelafalan"
        onClick={() => speakJapanese(segmentsToText(line.segments))}
        className="mt-1 shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
      >
        <Volume2 className="size-4" />
      </button>
    </div>
  );
}
