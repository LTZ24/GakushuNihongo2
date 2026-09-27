import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Flame, ListChecks, LogIn, Medal, Target } from "lucide-react";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { QUIZ_TYPE_LABELS } from "@/lib/japanese";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { QuizAttempt, QuizStats } from "@/types/japanese";

// Torii gate + mountain landscape (from design guidelines media list).
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1627052862140-069bd225b3b2?crop=entropy&cs=srgb&fm=jpg&q=85";

export default function Home() {
  const { user } = useAuth();
  const statsQuery = useQuery({
    queryKey: ["quiz-stats"],
    queryFn: () => apiGet<QuizStats>("/quiz/stats"),
    enabled: !!user,
    retry: false,
  });
  const attemptsQuery = useQuery({
    queryKey: ["quiz-attempts"],
    queryFn: () => apiGet<QuizAttempt[]>("/quiz/attempts?limit=5"),
    enabled: !!user,
    retry: false,
  });
  const stats = statsQuery.data;

  const statCards = [
    { label: "Total Sesi Quiz", value: stats?.total_sessions, icon: ListChecks, testid: "stats-total-sessions" },
    { label: "Rata-rata Skor", value: stats ? `${stats.average_percentage}%` : undefined, icon: Target, testid: "stats-average" },
    { label: "Skor Terbaik", value: stats ? `${stats.best_percentage}%` : undefined, icon: Medal, testid: "stats-best" },
    { label: "Streak Belajar", value: stats ? `${stats.streak_days} hari` : undefined, icon: Flame, testid: "stats-streak" },
  ];

  return (
    <div className="space-y-8 animate-fade-up">
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-sumi-900 text-white shadow-sm">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 size-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-sumi-900/95 via-sumi-900/80 to-sumi-900/30" />
        <div className="relative max-w-xl p-8 md:p-12">
          <Badge className="bg-crimson-600">Minna no Nihongo 1 & 2</Badge>
          <h1 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">
            Belajar Bahasa Jepang, <span className="font-jp text-crimson-400">いっしょに</span>!
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/85 md:text-base">
            Kurikulum 50 bab dengan Bunpo, Kotoba, Kanji, dan Kaiwa ber-furigana — plus lima jenis
            quiz interaktif. Semua penjelasan dalam Bahasa Indonesia.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/bab/1" data-testid="hero-cta-bab" className={buttonVariants()}>
              Mulai Bab 1
            </Link>
            <Link to="/quiz" data-testid="hero-cta-quiz" className={buttonVariants({ variant: "secondary" })}>
              Coba Quiz
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          to="/bab"
          data-testid="menu-card-bab"
          className="group rounded-3xl border border-border/70 bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-matcha-600/10 text-matcha-700 dark:text-matcha-300">
              <BookOpen className="size-6" />
            </span>
            <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
          <h2 className="mt-4 text-xl font-bold">Menu Bab</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Materi pembelajaran Bab 1–50: pola kalimat, kosakata, kanji, dan percakapan — lengkap
            dengan furigana di atas kanji.
          </p>
          <p className="mt-3 text-xs font-semibold text-matcha-700 dark:text-matcha-300">
            Minna no Nihongo 1 · Bab 1–25 &nbsp;·&nbsp; Minna no Nihongo 2 · Bab 26–50
          </p>
        </Link>

        <Link
          to="/quiz"
          data-testid="menu-card-quiz"
          className="group rounded-3xl border border-border/70 bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-crimson-600/10 text-crimson-700 dark:text-crimson-300">
              <ListChecks className="size-6" />
            </span>
            <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
          <h2 className="mt-4 text-xl font-bold">Menu Quiz</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Lima jenis latihan interaktif — Bunpo, Kanji, Kotoba, Campuran, dan Susun Kata gaya
            Duolingo. Pilih cakupan bab atau buku.
          </p>
          <p className="mt-3 text-xs font-semibold text-crimson-700 dark:text-crimson-300">
            Umpan balik instan · Hasil tersimpan sebagai statistik
          </p>
        </Link>
      </section>

      <section>
        <h2 className="text-lg font-bold">
          {user ? `Statistik Belajar ${user.name}` : "Statistik Belajarmu"}
        </h2>
        {!user && (
          <div
            className="mt-3 flex flex-col items-start justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center"
            data-testid="guest-stats-notice"
          >
            <p className="text-sm text-muted-foreground">
              Masuk untuk menyimpan skor quiz dan progress belajar per akun. Tanpa akun, progress
              akan hilang saat halaman dimuat ulang.
            </p>
            <Link
              to="/masuk"
              data-testid="guest-login-cta"
              className={buttonVariants({ size: "sm" })}
            >
              <LogIn className="size-4" /> Masuk / Daftar
            </Link>
          </div>
        )}
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4" data-testid="stats-grid">
          {statCards.map(({ label, value, icon: Icon, testid }) => (
            <div key={label} data-testid={testid} className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
              <Icon className="size-5 text-primary" />
              <p className="mt-2 text-2xl font-bold" data-testid={`${testid}-value`}>
                {value ?? "–"}
              </p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        {statsQuery.isError && user && (
          <p className="mt-2 text-xs text-muted-foreground">
            Statistik tidak tersedia saat ini — coba muat ulang halaman nanti.
          </p>
        )}
      </section>

      <section data-testid="attempts-list">
        <h2 className="text-lg font-bold">Riwayat Quiz</h2>
        <div className="mt-3 space-y-2">
          {!user ? (
            <p className="text-sm text-muted-foreground">
              Riwayat quiz tersimpan setelah Anda masuk ke akun.
            </p>
          ) : attemptsQuery.data?.length ? (
            attemptsQuery.data.map((attempt) => (
              <div
                key={attempt.id}
                data-testid="attempt-item"
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {QUIZ_TYPE_LABELS[attempt.quiz_type] ?? attempt.quiz_type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {attempt.scope_label} ·{" "}
                    {new Date(attempt.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                <Badge
                  variant={attempt.percentage >= 60 ? "secondary" : "outline"}
                  className={
                    attempt.percentage >= 60
                      ? "text-matcha-700 dark:text-matcha-300"
                      : "text-crimson-700 dark:text-crimson-300"
                  }
                  data-testid="attempt-score"
                >
                  {attempt.score}/{attempt.total} · {attempt.percentage}%
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              {attemptsQuery.isLoading ? "Memuat riwayat…" : "Belum ada riwayat — mulai quiz pertamamu!"}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
