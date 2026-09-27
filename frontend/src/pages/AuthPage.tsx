import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const body = err.body as { detail?: unknown } | null;
    const detail = body?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length) {
      const first = detail[0] as { msg?: string };
      if (first?.msg) return first.msg;
    }
  }
  return fallback;
}

/** Login & signup memakai satu komponen — akun lokal tersimpan di MySQL. */
export default function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const isSignup = mode === "signup";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isSignup) await signup(name, email, password);
      else await login(email, password);
      toast.success(isSignup ? "Akun berhasil dibuat — selamat belajar!" : "Berhasil masuk");
      navigate("/");
    } catch (err) {
      toast.error(
        errorMessage(err, isSignup ? "Pendaftaran gagal — periksa data Anda" : "Gagal masuk"),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center py-6 animate-fade-up">
      <div className="text-center">
        <span className="font-jp text-3xl font-bold text-primary">がくしゅう+</span>
        <h1 className="mt-4 text-2xl font-bold" data-testid="auth-title">
          {isSignup ? "Buat Akun Baru" : "Masuk ke Akun"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSignup
            ? "Simpan progress belajar dan riwayat quiz Anda."
            : "Lanjutkan progress belajar Anda."}
        </p>
      </div>

      <Card className="mt-6 p-6">
        <form onSubmit={submit} className="space-y-4" data-testid="auth-form">
          {isSignup && (
            <div>
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                data-testid="auth-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap Anda"
                required
                minLength={2}
                className="mt-1.5"
              />
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              data-testid="auth-email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@contoh.com"
              required
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="password">Kata Sandi</Label>
            <Input
              id="password"
              type="password"
              data-testid="auth-password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? "Minimal 6 karakter" : "Kata sandi Anda"}
              required
              minLength={isSignup ? 6 : 1}
              className="mt-1.5"
            />
          </div>
          <Button type="submit" data-testid="auth-submit-button" disabled={busy} className="w-full">
            {busy ? "Memproses…" : isSignup ? "Daftar" : "Masuk"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {isSignup ? "Sudah punya akun? " : "Belum punya akun? "}
          <Link
            to={isSignup ? "/masuk" : "/daftar"}
            data-testid="auth-switch-link"
            className="font-semibold text-primary hover:underline"
          >
            {isSignup ? "Masuk di sini" : "Daftar sekarang"}
          </Link>
        </p>
      </Card>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Login bersifat opsional — semua materi bab dan quiz bisa diakses tanpa akun, tetapi
        progress tamu akan hilang saat halaman dimuat ulang.
      </p>
      <Link
        to="/"
        data-testid="auth-skip-link"
        className="mt-2 text-center text-xs font-semibold text-primary hover:underline"
      >
        Lanjut tanpa akun
      </Link>
    </div>
  );
}
