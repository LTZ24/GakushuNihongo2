import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Furigana from "@/components/japanese/Furigana";
import SentenceLine from "@/components/japanese/SentenceLine";
import type { KotobaItem } from "@/types/japanese";

export default function KotobaList({ items }: { items: KotobaItem[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      [i.word, i.kana, i.romaji, i.meaning].some((v) => v.toLowerCase().includes(q)),
    );
  }, [items, query]);

  return (
    <div className="space-y-4">
      <Input
        data-testid="kotoba-search-input"
        placeholder="Cari kosakata… (kanji, kana, romaji, arti)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm bg-card"
      />
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((item) => (
          <div
            key={item.id}
            data-testid="kotoba-item"
            className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Furigana segments={item.segments} className="text-2xl font-semibold" />
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {item.kana} · {item.romaji}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {item.word_type}
              </Badge>
            </div>
            <p className="mt-2 text-sm font-medium">{item.meaning}</p>
            <div className="mt-3 rounded-xl bg-secondary/70 p-3">
              <SentenceLine line={item.example} className="[&>div>p]:mt-0" jpClassName="text-base md:text-lg" />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground md:col-span-2">
            Tidak ada kosakata yang cocok dengan pencarian.
          </p>
        )}
      </div>
    </div>
  );
}
