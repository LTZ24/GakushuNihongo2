import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { QUIZ_TYPE_LABELS } from "@/lib/japanese";
import { mistakeFromQuestion, saveGuestMistakes } from "@/lib/flashcards";
import Furigana from "@/components/japanese/Furigana";
import DuolingoReorder from "@/components/quiz/DuolingoReorder";
import QuizFeedback from "@/components/quiz/QuizFeedback";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MistakeInput, QuizAttempt, QuizQuestion, SaveResult } from "@/types/japanese";

const SUBTYPE_LABELS: Record<string, string> = {
  "bunpo-particle": "Partikel & Pola",
  "kanji-reading": "Cara Baca Kanji",
  "kanji-meaning": "Arti Kanji",
  "kotoba-jp-id": "Jepang → Indonesia",
  "kotoba-id-jp": "Indonesia → Jepang",
  "susun-kata": "Susun Kata",
};

function Results({
  score,
  total,
  quizType,
  scopeLabel,
  chapterNumber,
  mistakeCount,
  saving,
  saveError,
  isGuest,
  onRestart,
}: {
  score: number;
  total: number;
  quizType: string;
  scopeLabel: string;
  chapterNumber: number | null;
  mistakeCount: number;
  saving: boolean;
  saveError: boolean;
  isGuest: boolean;
  onRestart: () => void;
}) {
  const pct = total ? Math.round((score / total) * 100) : 0;
  const message =
    pct === 100
      ? "Sempurna! 素晴らしい"
      : pct >= 80
        ? "Hebat! よくできました"
        : pct >= 60
          ? "Bagus! Terus berlatih"
          : "Jangan menyerah — pelajari lagi materinya";
  const circumference = 2 * Math.PI * 52;

  return (
    <div className="mx-auto max-w-2xl animate-fade-up text-center" data-testid="quiz-results">
      <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Hasil {QUIZ_TYPE_LABELS[quizType] ?? quizType} — {scopeLabel}
      </p>
      <div className="relative mx-auto mt-6 size-44" data-testid="quiz-score-gauge">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-secondary" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className={pct >= 60 ? "stroke-matcha-500" : "stroke-crimson-500"}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct / 100)}
            style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" data-testid="quiz-score">
            {score}/{total}
          </span>
          <span className="text-sm text-muted-foreground" data-testid="quiz-percentage">
            {pct}%
          </span>
        </div>
      </div>
      <p className="mt-4 font-jp text-lg font-semibold">{message}</p>
      <div className="mt-2 flex justify-center gap-1.5" data-testid="result-dots">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              "size-3 rounded-full",
              score > i ? "bg-matcha-500" : "bg-crimson-500/70",
            )}
          />
        ))}
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={onRestart} data-testid="quiz-restart-button">
          <RotateCcw className="size-4" /> Ulangi Quiz
        </Button>
        <Link to="/quiz" data-testid="quiz-back-button" className={buttonVariants({ variant: "outline" })}>
          Menu Quiz
        </Link>
        {mistakeCount > 0 && (
          <Link
            to="/kartu"
            data-testid="results-kartu-link"
            className={buttonVariants({ variant: "secondary" })}
          >
            Latih {mistakeCount} Kartu Hafalan
          </Link>
        )}
        {chapterNumber !== null && (
          <Link
            to={`/bab/${chapterNumber}`}
            data-testid="quiz-to-bab-link"
            className={buttonVariants({ variant: "secondary" })}
          >
            Pelajari Materinya
          </Link>
        )}
      </div>
      <p className="mt-4 text-xs text-muted-foreground" data-testid="quiz-save-status">
        {isGuest
          ? "Masuk ke akun untuk menyimpan skor ini — progress tamu hilang saat dimuat ulang."
          : saving
            ? "Menyimpan hasil…"
            : saveError
              ? "Hasil tidak dapat disimpan saat ini."
              : "Hasil tersimpan ke statistik belajarmu."}
      </p>
      {isGuest && (
        <Link to="/masuk" data-testid="results-login-cta" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Masuk untuk menyimpan progress
        </Link>
      )}
    </div>
  );
}

export default function QuizPlay() {
  const [params] = useSearchParams();
  const quizType = params.get("type") ?? "bunpo";
  const scopeType = params.get("scope") ?? "chapter";
  const scopeValue = params.get("value") ?? "1";
  const scopeLabel =
    scopeType === "chapter"
      ? `Bab ${scopeValue}`
      : scopeType === "all"
        ? "Semua Bab"
        : scopeType === "chapters"
          ? `Bab ${scopeValue}`
          : scopeValue === "minna1"
            ? "Minna no Nihongo 1"
            : "Minna no Nihongo 2";

  const { data: questions, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["quiz-questions", quizType, scopeType, scopeValue],
    queryFn: () =>
      apiGet<QuizQuestion[]>(
        `/quiz/questions?quiz_type=${quizType}&scope_type=${scopeType}&scope_value=${scopeValue}`,
      ),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"answering" | "feedback">("answering");
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const postedRef = useRef(false);
  const mistakesRef = useRef<MistakeInput[]>([]);
  const mistakesSavedRef = useRef(false);

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const mistakeMutation = useMutation({
    mutationFn: (items: MistakeInput[]) => apiPost<SaveResult>("/flashcards/mistakes", items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["flashcards"] }),
  });
  const attemptMutation = useMutation({
    mutationFn: (body: {
      quiz_type: string;
      scope_type: string;
      scope_value: string;
      scope_label: string;
      score: number;
      total: number;
    }) => apiPost<QuizAttempt>("/quiz/attempts", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-attempts"] });
      queryClient.invalidateQueries({ queryKey: ["quiz-stats"] });
    },
  });

  const total = questions?.length ?? 0;
  const question = questions?.[index];
  const isLast = total > 0 && index >= total - 1;

  const answer = (correct: boolean, optionIndex: number | null = null) => {
    if (!correct && question) {
      const mistake = mistakeFromQuestion(
        question,
        scopeType === "chapter" ? Number(scopeValue) : null,
      );
      if (!mistakesRef.current.some((m) => m.item_key === mistake.item_key)) {
        mistakesRef.current.push(mistake);
      }
    }
    setSelected(optionIndex);
    setAnswers((prev) => [...prev, correct]);
    setPhase("feedback");
  };

  const next = () => {
    if (!isLast) {
      setIndex((i) => i + 1);
      setSelected(null);
      setPhase("answering");
      return;
    }
    setFinished(true);
    if (!mistakesSavedRef.current) {
      mistakesSavedRef.current = true;
      const mistakes = mistakesRef.current;
      if (mistakes.length) {
        if (user) mistakeMutation.mutate(mistakes);
        else saveGuestMistakes(mistakes);
      }
    }
    if (!postedRef.current && user) {
      postedRef.current = true;
      attemptMutation.mutate({
        quiz_type: quizType,
        scope_type: scopeType,
        scope_value: scopeValue,
        scope_label: scopeLabel,
        score: answers.filter(Boolean).length,
        total,
      });
    }
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setAnswers([]);
    setPhase("answering");
    setFinished(false);
    postedRef.current = false;
    mistakesRef.current = [];
    mistakesSavedRef.current = false;
    refetch();
  };

  // Keyboard shortcuts 1–4 for MCQ answering.
  useEffect(() => {
    if (!question || question.type === "susun" || phase !== "answering") return;
    const handler = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= question.options.length) {
        e.preventDefault();
        answer(n - 1 === question.answer_index, n - 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, phase]);

  if (finished && total > 0) {
    return (
      <Results
        score={answers.filter(Boolean).length}
        total={total}
        quizType={quizType}
        scopeLabel={scopeLabel}
        chapterNumber={scopeType === "chapter" ? Number(scopeValue) : null}
        mistakeCount={mistakesRef.current.length}
        saving={attemptMutation.isPending}
        saveError={attemptMutation.isError}
        isGuest={!user}
        onRestart={restart}
      />
    );
  }

  const apiDetail = (error as { body?: { detail?: string } } | null)?.body?.detail;

  return (
    <div className="mx-auto max-w-2xl animate-fade-up" data-testid="quiz-runner">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          to="/quiz"
          data-testid="quiz-exit-link"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" /> Keluar
        </Link>
        <p className="text-sm font-semibold text-muted-foreground" data-testid="quiz-progress-label">
          {QUIZ_TYPE_LABELS[quizType] ?? quizType} · Soal {Math.min(index + 1, total || 1)}/{total || "…"}
        </p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary" data-testid="quiz-progress-bar">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${total ? (answers.length / total) * 100 : 0}%` }}
        />
      </div>

      {isLoading && (
        <div className="mt-5 space-y-4">
          <div className="h-32 animate-pulse rounded-2xl bg-secondary/60" />
          <div className="h-14 animate-pulse rounded-2xl bg-secondary/60" />
          <div className="h-14 animate-pulse rounded-2xl bg-secondary/60" />
        </div>
      )}

      {isError && (
        <Card className="mt-5 p-6 text-center" data-testid="quiz-error">
          <p className="font-semibold">Soal tidak dapat dimuat</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {apiDetail ?? "Terjadi kesalahan — coba lagi."}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Button variant="outline" onClick={() => refetch()} data-testid="quiz-retry-button">
              Coba Lagi
            </Button>
            <Link to="/quiz" className={buttonVariants({ variant: "ghost" })}>
              Menu Quiz
            </Link>
          </div>
        </Card>
      )}

      {!isError && questions && questions.length === 0 && (
        <Card className="mt-5 p-6 text-center" data-testid="quiz-empty">
          <p className="font-semibold">Belum ada soal untuk cakupan ini</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Saat ini materi lengkap baru tersedia di Bab 1.
          </p>
        </Card>
      )}

      {question && !isError && (
        <Card className="mt-5 p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{SUBTYPE_LABELS[question.subtype] ?? question.subtype}</Badge>
            <span className="text-xs text-muted-foreground">{question.prompt_label}</span>
          </div>

          {question.type === "susun" ? (
            <div className="mt-5">
              <p className="text-lg font-semibold leading-snug" data-testid="quiz-prompt">
                “{question.prompt_text}”
              </p>
              {question.hint && (
                <p className="mt-1 font-jp text-sm text-muted-foreground">Petunjuk: {question.hint}</p>
              )}
              <div className="mt-6">
                <DuolingoReorder
                  key={question.id}
                  question={question}
                  disabled={phase === "feedback"}
                  onCheck={(_chosen, correct) => answer(correct)}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="mt-5 flex min-h-20 items-center justify-center rounded-2xl bg-secondary/60 p-4 text-center">
                {question.prompt_segments ? (
                  <div data-testid="quiz-prompt">
                    <Furigana segments={question.prompt_segments} className="text-3xl font-semibold" />
                  </div>
                ) : (
                  <p
                    data-testid="quiz-prompt"
                    className={cn(
                      question.subtype === "kanji-meaning"
                        ? "font-jp text-6xl font-semibold"
                        : "text-xl font-semibold",
                      question.subtype.startsWith("kanji") && "font-jp",
                    )}
                  >
                    {question.prompt_text}
                  </p>
                )}
              </div>
              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {question.options.map((option, i) => {
                  const revealed = phase === "feedback";
                  const isAnswer = i === question.answer_index;
                  return (
                    <button
                      key={i}
                      type="button"
                      data-testid={`quiz-option-${i}`}
                      disabled={revealed}
                      onClick={() => answer(i === question.answer_index, i)}
                      className={cn(
                        "rounded-2xl border-2 p-4 text-left font-jp text-lg font-medium transition-all",
                        !revealed &&
                          "border-border bg-card hover:border-primary/60 hover:bg-primary/5 active:scale-[0.99]",
                        revealed &&
                          isAnswer &&
                          "border-matcha-500 bg-matcha-500/10 text-matcha-700 dark:text-matcha-300",
                        revealed &&
                          selected === i &&
                          !isAnswer &&
                          "border-crimson-500 bg-crimson-500/10 text-crimson-700 dark:text-crimson-300",
                        revealed && !isAnswer && selected !== i && "border-border/50 opacity-50",
                      )}
                    >
                      <span className="mr-2 inline-flex size-6 items-center justify-center rounded-md bg-secondary text-xs font-bold text-muted-foreground">
                        {i + 1}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      )}

      {phase === "feedback" && question && (
        <QuizFeedback
          question={question}
          correct={answers[answers.length - 1] ?? false}
          isLast={isLast}
          onNext={next}
        />
      )}
    </div>
  );
}
