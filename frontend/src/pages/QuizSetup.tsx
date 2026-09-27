import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Book, Languages, NotebookPen, Puzzle, Shuffle, Type } from "lucide-react";
import { apiGet } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ChapterSummary, QuizType } from "@/types/japanese";

const QUIZ_MODES: { type: QuizType; title: string; desc: string; icon: typeof NotebookPen }[] = [
  { type: "bunpo", title: "Quiz Bunpo", desc: "Pilihan ganda — pilih partikel atau pola kalimat yang tepat.", icon: NotebookPen },
  { type: "kanji", title: "Quiz Kanji", desc: "Tebak cara baca (furigana) atau arti dari kanji yang ditampilkan.", icon: Type },
  { type: "kotoba", title: "Quiz Kotoba", desc: "Tebak arti kosakata, dua arah: Jepang ke Indonesia dan sebaliknya.", icon: Languages },
  { type: "mix", title: "Quiz Campuran", desc: "Gabungan acak dari soal Bunpo, Kanji, dan Kotoba.", icon: Shuffle },
  { type: "susun", title: "Susun Kata", desc: "Gaya Duolingo — susun blok kata menjadi kalimat utuh yang benar.", icon: Puzzle },
];

const BOOK_OPTIONS = [
  { value: "minna1", label: "Minna no Nihongo 1", desc: "Mencakup Bab 1–25" },
  { value: "minna2", label: "Minna no Nihongo 2", desc: "Mencakup Bab 26–50" },
];

export default function QuizSetup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"chapter" | "book">(
    params.get("scope") === "book" ? "book" : "chapter",
  );
  const [chapter, setChapter] = useState(params.get("value") ?? "1");
  const [book, setBook] = useState("minna1");
  const [quizType, setQuizType] = useState<QuizType | null>((params.get("type") as QuizType) || null);

  const { data: chapters } = useQuery({
    queryKey: ["chapters"],
    queryFn: () => apiGet<ChapterSummary[]>("/chapters"),
    retry: false,
  });

  const chapterOptions = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const num = i + 1;
        const found = chapters?.find((c) => c.number === num);
        return { number: num, hasContent: found ? found.has_content : num === 1 };
      }),
    [chapters],
  );

  const selectedChapterReady =
    mode === "chapter" ? chapterOptions.find((o) => o.number === Number(chapter))?.hasContent : true;
  const canStart = quizType !== null && selectedChapterReady === true;

  const start = () => {
    if (!quizType) return;
    navigate(`/quiz/play?type=${quizType}&scope=${mode}&value=${mode === "chapter" ? chapter : book}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-up">
      <header>
        <h1 className="text-2xl font-bold md:text-3xl">Menu Quiz</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih cakupan kuis, lalu jenis latihan — 10 soal dengan umpan balik dan pembahasan instan.
        </p>
      </header>

      <section>
        <Label className="text-base font-bold">1 · Cakupan Kuis</Label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2" data-testid="quiz-scope">
          <button
            type="button"
            data-testid="quiz-scope-chapter"
            onClick={() => setMode("chapter")}
            className={cn(
              "rounded-2xl border-2 p-4 text-left transition-all",
              mode === "chapter"
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card hover:border-primary/40",
            )}
          >
            <p className="font-semibold">Bab Spesifik</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Fokus ke satu bab, misal hanya Bab 1 atau Bab 15.
            </p>
          </button>
          <button
            type="button"
            data-testid="quiz-scope-book"
            onClick={() => setMode("book")}
            className={cn(
              "rounded-2xl border-2 p-4 text-left transition-all",
              mode === "book"
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card hover:border-primary/40",
            )}
          >
            <p className="font-semibold">Seluruh Buku</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Minna no Nihongo 1 (Bab 1–25) atau 2 (Bab 26–50).
            </p>
          </button>
        </div>

        {mode === "chapter" ? (
          <div className="mt-4">
            <Label className="text-sm text-muted-foreground">Pilih bab</Label>
            <Select value={chapter} onValueChange={(value: string) => setChapter(value)}>
              <SelectTrigger className="mt-1.5 w-full sm:max-w-xs" data-testid="quiz-scope-value-select">
                <SelectValue>{chapter ? `Bab ${chapter}` : "Pilih bab"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {chapterOptions.map((option) => (
                  <SelectItem
                    key={option.number}
                    value={String(option.number)}
                    disabled={!option.hasContent}
                    data-testid={`quiz-scope-chapter-${option.number}`}
                  >
                    Bab {option.number}
                    {option.hasContent ? "" : " · segera"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {BOOK_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                data-testid={`book-option-${option.value}`}
                onClick={() => setBook(option.value)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all",
                  book === option.value
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                <Book className="size-5 shrink-0 text-primary" />
                <span>
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">{option.desc}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        <p className="mt-3 rounded-xl bg-secondary/70 p-3 text-xs leading-relaxed text-muted-foreground">
          Proof of Concept: materi lengkap baru tersedia di Bab 1. Quiz cakupan buku memakai soal
          dari bab yang sudah tersedia.
        </p>
      </section>

      <section>
        <Label className="text-base font-bold">2 · Jenis Quiz</Label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUIZ_MODES.map(({ type, title, desc, icon: Icon }) => (
            <button
              key={type}
              type="button"
              data-testid={`quiz-type-${type}`}
              onClick={() => setQuizType(type)}
              className={cn(
                "rounded-2xl border-2 p-4 text-left transition-all",
                quizType === type
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/40 hover:-translate-y-0.5",
              )}
            >
              <Icon className={cn("size-6", quizType === type ? "text-primary" : "text-muted-foreground")} />
              <p className="mt-2 font-semibold">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="flex flex-col items-start gap-3 rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">
            {quizType ? QUIZ_MODES.find((m) => m.type === quizType)?.title : "Pilih jenis quiz"}
          </p>
          <p className="text-sm text-muted-foreground">
            {mode === "chapter" ? `Cakupan: Bab ${chapter}` : `Cakupan: ${BOOK_OPTIONS.find((b) => b.value === book)?.label}`} · 10 soal
          </p>
        </div>
        <Button size="lg" data-testid="quiz-start-button" disabled={!canStart} onClick={start}>
          Mulai Quiz
        </Button>
      </div>
    </div>
  );
}
