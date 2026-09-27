import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Lock } from "lucide-react";
import { apiGet } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ChapterSummary } from "@/types/japanese";

export default function BabList() {
  const { data: chapters, isLoading, isError } = useQuery({
    queryKey: ["chapters"],
    queryFn: () => apiGet<ChapterSummary[]>("/chapters"),
    retry: false,
  });
  const [filter, setFilter] = useState("all");

  const filtered = (chapters ?? []).filter((c) => filter === "all" || String(c.book) === filter);

  return (
    <div className="space-y-5 animate-fade-up">
      <header>
        <h1 className="text-2xl font-bold md:text-3xl">Menu Bab</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Materi pembelajaran 50 bab — Bab 1–25 Minna no Nihongo 1, Bab 26–50 Minna no Nihongo 2.
        </p>
      </header>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all" data-testid="filter-all">
            Semua
          </TabsTrigger>
          <TabsTrigger value="1" data-testid="filter-book-1">
            Minna no Nihongo 1
          </TabsTrigger>
          <TabsTrigger value="2" data-testid="filter-book-2">
            Minna no Nihongo 2
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-secondary/60" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-muted-foreground" data-testid="bab-list-error">
          Daftar bab tidak dapat dimuat saat ini — coba lagi nanti.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="bab-grid">
        {filtered.map((chapter) =>
          chapter.has_content ? (
            <Link
              key={chapter.number}
              to={`/bab/${chapter.number}`}
              data-testid={`bab-card-${chapter.number}`}
              className="group rounded-2xl border-2 border-primary/40 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                  {chapter.number}
                </span>
                <div className="min-w-0">
                  <p className="font-jp text-base font-semibold leading-snug">{chapter.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {chapter.title_translation}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Badge className="bg-matcha-600 text-[10px]">{chapter.book_label}</Badge>
                <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                  Mulai belajar <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ) : (
            <button
              key={chapter.number}
              type="button"
              data-testid={`bab-card-locked-${chapter.number}`}
              onClick={() =>
                toast.info(`Materi Bab ${chapter.number} segera tersedia — Proof of Concept saat ini mencakup Bab 1.`)
              }
              className="rounded-2xl border border-border/60 bg-card/60 p-4 text-left opacity-80 transition-colors hover:bg-card"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-lg font-bold text-muted-foreground">
                  {chapter.number}
                </span>
                <div className="min-w-0">
                  <p className="font-jp text-base font-semibold leading-snug text-muted-foreground">
                    {chapter.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {chapter.title_translation}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Badge
                  variant="outline"
                  className={
                    chapter.book === 1
                      ? "border-matcha-500/40 text-[10px] text-matcha-700 dark:text-matcha-300"
                      : "border-indigo-300 text-[10px] text-indigo-700 dark:text-indigo-300"
                  }
                >
                  {chapter.book_label}
                </Badge>
                <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Lock className="size-3.5" /> Segera
                </span>
              </div>
            </button>
          ),
        )}
      </div>
    </div>
  );
}
