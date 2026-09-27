import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Lock, Play } from "lucide-react";
import { apiGet } from "@/lib/api";
import BunpoCard from "@/components/japanese/BunpoCard";
import KanjiCard from "@/components/japanese/KanjiCard";
import KaiwaSection from "@/components/japanese/KaiwaSection";
import KotobaList from "@/components/japanese/KotobaList";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ChapterDetail } from "@/types/japanese";

export default function BabDetail() {
  const { number } = useParams();
  const babNumber = Number(number);
  const [tab, setTab] = useState("bunpo");
  const { data: chapter, isLoading, isError } = useQuery({
    queryKey: ["chapter", babNumber],
    queryFn: () => apiGet<ChapterDetail>(`/chapters/${babNumber}`),
    enabled: Number.isFinite(babNumber) && babNumber >= 1 && babNumber <= 50,
    retry: false,
  });

  const content = chapter?.content ?? null;

  return (
    <div className="space-y-5 animate-fade-up">
      <Link
        to="/bab"
        data-testid="bab-back-link"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Menu Bab
      </Link>

      {isLoading && (
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-3xl bg-secondary/60" />
          <div className="h-10 w-72 animate-pulse rounded-full bg-secondary/60" />
          <div className="h-64 animate-pulse rounded-3xl bg-secondary/60" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-muted-foreground" data-testid="bab-detail-error">
          Bab tidak ditemukan — kembali ke Menu Bab dan pilih salah satu daftar.
        </p>
      )}

      {chapter && (
        <>
          <header className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary">Bab {chapter.number}</Badge>
              <Badge
                variant="outline"
                className={cn(
                  chapter.book === 1
                    ? "border-matcha-500/50 text-matcha-700 dark:text-matcha-300"
                    : "border-indigo-300 text-indigo-700 dark:text-indigo-300",
                )}
              >
                {chapter.book_label}
              </Badge>
              {chapter.is_locked && <Badge variant="secondary">Segera</Badge>}
            </div>
            <h1
              className={cn(
                "mt-3 font-jp text-2xl font-bold leading-snug md:text-3xl",
                chapter.is_locked && "text-muted-foreground",
              )}
              data-testid="bab-title"
            >
              {chapter.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground" data-testid="bab-title-translation">
              {chapter.title_translation}
            </p>
          </header>

          {content ? (
            <>
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
                  <TabsTrigger value="bunpo" data-testid="tab-bunpo">
                    Bunpo
                  </TabsTrigger>
                  <TabsTrigger value="kotoba" data-testid="tab-kotoba">
                    Kotoba
                    <span className="ml-1 text-[10px] text-muted-foreground">{content.kotoba.length}</span>
                  </TabsTrigger>
                  <TabsTrigger value="kanji" data-testid="tab-kanji">
                    Kanji
                    <span className="ml-1 text-[10px] text-muted-foreground">{content.kanji.length}</span>
                  </TabsTrigger>
                  <TabsTrigger value="kaiwa" data-testid="tab-kaiwa">
                    Kaiwa
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="bunpo" className="mt-4 space-y-4">
                  {content.bunpo.map((point) => (
                    <BunpoCard key={point.id} point={point} />
                  ))}
                </TabsContent>

                <TabsContent value="kotoba" className="mt-4">
                  <KotobaList items={content.kotoba} />
                </TabsContent>

                <TabsContent value="kanji" className="mt-4 grid gap-4 md:grid-cols-2">
                  {content.kanji.map((kanji) => (
                    <KanjiCard key={kanji.id} kanji={kanji} />
                  ))}
                </TabsContent>

                <TabsContent value="kaiwa" className="mt-4">
                  <KaiwaSection kaiwa={content.kaiwa} />
                </TabsContent>
              </Tabs>

              <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 text-center">
                <p className="font-semibold">Sudah paham materinya?</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Uji pemahamanmu dengan latihan interaktif Bab {chapter.number}.
                </p>
                <Link
                  to={`/quiz?scope=chapter&value=${chapter.number}`}
                  data-testid="bab-quiz-cta"
                  className={cn(buttonVariants(), "mt-4")}
                >
                  <Play className="size-4" /> Latihan Bab {chapter.number}
                </Link>
              </div>
            </>
          ) : (
            <div
              className="rounded-3xl border border-dashed border-border p-10 text-center"
              data-testid="bab-locked"
            >
              <Lock className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 font-semibold">Materi Bab {chapter.number} segera tersedia</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Proof of Concept saat ini mencakup Bab 1 lengkap — Bunpo, Kotoba, Kanji, dan Kaiwa.
              </p>
              <Link to="/bab/1" data-testid="bab-locked-to-bab1" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
                Buka Bab 1
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
