import { cn } from "@/lib/utils";
import type { RubySegment } from "@/types/japanese";

/** Renders Japanese text with furigana (<ruby>/<rt>) above each kanji segment. */
export default function Furigana({
  segments,
  className,
}: {
  segments: RubySegment[];
  className?: string;
}) {
  return (
    <span className={cn("font-jp leading-loose tracking-[0.02em]", className)}>
      {segments.map((seg, i) =>
        seg.reading ? (
          <ruby key={i}>
            {seg.text}
            <rt>{seg.reading}</rt>
          </ruby>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </span>
  );
}
