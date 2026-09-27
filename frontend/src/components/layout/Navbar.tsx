import { Link, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Home, Layers, LineChart, ListChecks, LogOut, Moon, PenTool, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/", label: "Beranda", testid: "nav-home", icon: Home },
  { to: "/bab", label: "Bab", testid: "nav-bab", icon: BookOpen },
  { to: "/quiz", label: "Quiz", testid: "nav-quiz", icon: ListChecks },
  { to: "/kanji", label: "Kanji", testid: "nav-kanji", icon: PenTool },
  { to: "/kartu", label: "Kartu", testid: "nav-kartu", icon: Layers },
  { to: "/progres", label: "Progres", testid: "nav-progres", icon: LineChart },
];

function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      data-testid="theme-toggle"
      aria-label="Ganti tema terang/gelap"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "rounded-full border border-border/70 bg-card p-2 text-muted-foreground transition-colors hover:text-primary",
        className,
      )}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

/** Top navbar (desktop) + fixed bottom tab bar (mobile) — the two main menus live in both. */
export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname.startsWith(to);

  const handleLogout = () => {
    logout();
    toast.success("Anda telah keluar");
    navigate("/");
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" data-testid="nav-logo" className="flex items-center gap-2">
            <span className="font-jp text-2xl font-bold tracking-tight text-primary">
              がくしゅう
            </span>
            <span className="rounded-lg bg-primary px-1.5 py-0.5 text-sm font-bold text-primary-foreground">
              +
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map(({ to, label, testid }) => (
              <Link
                key={to}
                to={to}
                data-testid={testid}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  isActive(to)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {label}
              </Link>
            ))}
            <ThemeToggle className="ml-2" />
            {user ? (
              <div className="ml-2 flex items-center gap-2">
                <span
                  data-testid="navbar-user-name"
                  className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold"
                >
                  <User className="size-3.5 text-primary" />
                  {user.name}
                </span>
                <button
                  type="button"
                  data-testid="navbar-logout-button"
                  onClick={handleLogout}
                  aria-label="Keluar"
                  className="rounded-full border border-border/70 bg-card p-2 text-muted-foreground transition-colors hover:text-primary"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/masuk"
                data-testid="navbar-login-link"
                className="ml-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Masuk
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-2 md:hidden">
            {user ? (
              <button
                type="button"
                data-testid="navbar-logout-button-mobile"
                onClick={handleLogout}
                aria-label="Keluar"
                className="rounded-full border border-border/70 bg-card p-2 text-muted-foreground"
              >
                <LogOut className="size-4" />
              </button>
            ) : (
              <Link
                to="/masuk"
                data-testid="navbar-login-link-mobile"
                className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                Masuk
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid grid-cols-6">
          {LINKS.map(({ to, label, testid, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              data-testid={testid}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                isActive(to) ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
