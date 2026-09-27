import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Award, Flame, Target, TrendingUp } from "lucide-react";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FlashcardItem, QuizAttempt, QuizStats } from "@/types/japanese";

function StatCard({ icon: Icon, label, value, testid }: {
  icon: typeof Target; label: string; value: string; testid: string;
}) {
  return (
    <Card className="p-4" data-testid={testid}>
      <Icon className="size-5 text-primary" />
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["quiz-stats"],
    queryFn: () => apiGet<QuizStats>("/quiz/stats"),
    enabled: Boolean(user),
  });
  const { data: attempts } = useQuery({
    queryKey: ["quiz-attempts"],
    queryFn: () => apiGet<QuizAttempt[]>("/quiz/attempts?limit=15"),
    enabled: Boolean(user),
  });
  const { data: kanjiMisses } = useQuery({
    queryKey: ["flashcards", "kanji"],
    queryFn: () => apiGet<FlashcardItem[]>("/flashcards?kind=kanji&limit=8"),
    enabled: Boolean(user),
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-md animate-fade-up text-center" data-testid="dashboard-guest">
        <TrendingUp className="mx-auto size-8 text-primary" />
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Dasbor Progres</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Masuk untuk melihat riwayat skor, streak, dan kanji yang paling sering kamu salah.
        </p>
        <Link to="/masuk" data-testid="dashboard-login-link" className={cn(buttonVariants({}), "mt-4")}>
          Masuk
        </Link>
      </div>
    );
  }

  const recent = attempts ?? [];
  const maxPct = 100;

  return (
    <div className="mx-auto max-w-3xl animate-fade-up" data-testid="dashboard-page">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Dasbor Progres</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight" data-testid="dashboard-title">
        Halo, {user.name}
      </h1>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Target} label="Sesi kuis" value={String(stats?.total_sessions ?? 0)} testid="stat-sessions" />
        <StatCard icon={TrendingUp} label="Rata-rata" value={`${stats?.average_percentage ?? 0}%`} testid="stat-average" />
        <StatCard icon={Award} label="Skor terbaik" value={`${stats?.best_percentage ?? 0}%`} testid="stat-best" />
        <StatCard icon={Flame} label="Streak hari" value={String(stats?.streak_days ?? 0)} testid="stat-streak" />
      </div>

      <Card className="mt-5 p-5" data-testid="dashboard-history">
        <h2 className="text-sm font-semibold">Riwayat skor terakhir</h2>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Belum ada riwayat. <Link to="/quiz" className="font-semibold text-primary hover:underline">Mulai kuis →</Link>
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {recent.map((a) => (
              <div key={a.id} className="flex items-center gap-3" data-testid="dashboard-attempt-row">
                <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">{a.scope_label}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(a.percentage / maxPct) * 100}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-xs font-semibold">{a.percentage}%</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-5 p-5" data-testid="dashboard-weak-kanji">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Kanji paling sering salah</h2>
          <Link to="/kartu" className="text-xs font-semibold text-primary hover:underline">Latih kartu →</Link>
        </div>
        {(kanjiMisses ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Belum ada — kerjakan kuis kanji dulu.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {(kanjiMisses ?? []).map((c) => (
              <Badge key={c.item_key} variant="outline" data-testid="dashboard-weak-kanji-item">
                <span className="font-jp text-base">{c.front_text ?? c.back_text}</span>
                <span className="ml-1 text-crimson-600 dark:text-crimson-300">×{c.wrong_count}</span>
              </Badge>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
