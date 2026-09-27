import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, ListChecks, RotateCcw, Shuffle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { KIND_LABELS, loadGuestCards, setGuestMastered } from "@/lib/flashcards";
import Furigana from "@/components/japanese/Furigana";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FlashcardItem } from "@/types/japanese";

const FILTERS = ["semua", "kotoba", "kanji", "bunpo", "susun"] as const;

export default function Kartu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("semua");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [guestCards, setGuestCards] = useState<FlashcardItem[]>([]);

  useEffect(() => {
    if (!user) setGuestCards(loadGuestCards());
  }, [user]);

  const { data: serverCards, isLoading } = useQuery({
    queryKey: ["flashcards"],
    queryFn: () => apiGet<FlashcardItem[]>("/flashcards"),
    enabled: Boolean(user),
  });

  const masteredMutation = useMutation({
    mutationFn: (itemKey: string) =>
      apiPost<FlashcardItem>("/flashcards/mastered", { item_key: itemKey, mastered: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["flashcards"] }),
  });

  const cards = useMemo(() => {
    const source = user ? (serverCards ?? []) : guestCards;
    return filter === "semua" ? source : source.filter((c) => c.kind === filter);
  }, [user, serverCards, guestCards, filter]);

  const card = cards[index];

  const quizChapters = useMemo(() => {
    const set = new Set<number>();
    for (const c of cards) if (typeof c.chapter === "number") set.add(c.chapter);
    return [...set].sort((a, b) => a - b);
  }, [cards]);

  const startQuizFromCards = () => {
    if (!quizChapters.length) {
      toast.error("Kartu belum punya info bab untuk dijadikan kuis");
      return;
    }
    const type = filter === "semua" ? "mix" : filter;
    navigate(`/quiz/play?type=${type}&scope=chapters&value=${quizChapters.join(",")}`);
  };

  const markMastered = () => {
    if (!card) return;
    if (user) masteredMutation.mutate(card.item_key);
    else {
      setGuestMastered(card.item_key, true);
      setGuestCards(loadGuestCards());
    }
    toast.success("Ditandai sudah hafal");
    setFlipped(false);
    setIndex((i) => (i >= cards.length - 1 ? 0 : i));
  };

  const nextCard = () => {
    setFlipped(false);
    setIndex((i) => (cards.length ? (i + 1) % cards.length : 0));
  };

  const shuffle = () => {
    setFlipped(false);
    setIndex(cards.length ? Math.floor(Math.random() * cards.length) : 0);
  };

  return (
    <div className="mx-auto max-w-2xl animate-fade-up" data-testid="kartu-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Kartu Hafalan
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight" data-testid="kartu-title">
            Ulangi yang sering salah
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kata dan kanji yang paling sering kamu jawab salah muncul lebih dulu.
          </p>
        </div>
        <Badge variant="secondary" data-testid="kartu-count">
          <Layers className="size-3.5" /> {cards.length} kartu
        </Badge>
      </div>

      {cards.length > 0 && (
        <Button
          className="mt-4 w-full sm:w-auto"
          onClick={startQuizFromCards}
          data-testid="kartu-quiz-button"
        >
          <ListChecks className="size-4" /> Kuis Dari Kartu ({quizChapters.length} bab)
        </Button>
      )}

      <div className="mt-4 flex flex-wrap gap-2" data-testid="kartu-filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            data-testid={`kartu-filter-${f}`}
            onClick={() => {
              setFilter(f);
              setIndex(0);
              setFlipped(false);
            }}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
              filter === f
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/70 text-muted-foreground hover:text-foreground",
            )}
          >
            {f === "semua" ? "Semua" : (KIND_LABELS[f] ?? f)}
          </button>
        ))}
      </div>

      {user && isLoading && (
        <div className="mt-6 h-56 animate-pulse rounded-3xl bg-secondary/60" />
      )}

      {!card && !(user && isLoading) && (
        <Card className="mt-6 p-8 text-center" data-testid="kartu-empty">
          <Sparkles className="mx-auto size-8 text-primary" />
          <p className="mt-3 font-semibold">Belum ada kartu hafalan</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Kerjakan kuis dulu — setiap jawaban salah otomatis jadi kartu hafalan di sini.
            {!user && " Sebagai tamu, kartu disimpan sementara di browser ini."}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link to="/quiz" data-testid="kartu-to-quiz-link" className={buttonVariants({})}>
              Mulai Quiz
            </Link>
            {!user && (
              <Link to="/masuk" className={buttonVariants({ variant: "outline" })}>
                Masuk
              </Link>
            )}
          </div>
        </Card>
      )}

      {card && (
        <>
          <button
            type="button"
            data-testid="kartu-flip-button"
            onClick={() => setFlipped((v) => !v)}
            className="mt-6 block w-full text-left"
          >
            <Card
              className={cn(
                "min-h-56 p-7 shadow-sm transition-shadow duration-300 hover:shadow-md",
                flipped && "border-primary/50 bg-primary/[0.04]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" data-testid="kartu-kind">
                  {KIND_LABELS[card.kind] ?? card.kind}
                </Badge>
                <span className="text-xs font-semibold text-crimson-600 dark:text-crimson-300" data-testid="kartu-wrong-count">
                  salah {card.wrong_count}×
                </span>
              </div>
              <div className="mt-6 text-center">
                {flipped ? (
                  <div data-testid="kartu-back">
                    <p className="font-jp text-3xl font-semibold">{card.back_text}</p>
                    {card.explanation && (
                      <p className="mt-3 text-sm text-muted-foreground">{card.explanation}</p>
                    )}
                  </div>
                ) : (
                  <div data-testid="kartu-front">
                    {card.front_segments ? (
                      <Furigana segments={card.front_segments} className="text-3xl font-semibold" />
                    ) : (
                      <p className="font-jp text-3xl font-semibold">{card.front_text}</p>
                    )}
                    <p className="mt-4 text-xs text-muted-foreground">
                      Ketuk kartu untuk melihat jawaban
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </button>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" data-testid="kartu-position">
              Kartu {index + 1} dari {cards.length}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={shuffle} data-testid="kartu-shuffle-button">
                <Shuffle className="size-4" /> Acak
              </Button>
              <Button variant="secondary" size="sm" onClick={nextCard} data-testid="kartu-next-button">
                <RotateCcw className="size-4" /> Masih Salah
              </Button>
              <Button size="sm" onClick={markMastered} data-testid="kartu-mastered-button">
                Sudah Hafal
              </Button>
            </div>
          </div>
          {!user && (
            <p className="mt-3 text-xs text-muted-foreground" data-testid="kartu-guest-note">
              Kamu belum masuk — kartu tamu hanya tersimpan di browser ini.
            </p>
          )}
        </>
      )}
    </div>
  );
}
