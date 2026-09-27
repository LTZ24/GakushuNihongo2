import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import Home from "@/pages/Home";
import BabList from "@/pages/BabList";
import BabDetail from "@/pages/BabDetail";
import QuizSetup from "@/pages/QuizSetup";
import QuizPlay from "@/pages/QuizPlay";
import Kartu from "@/pages/Kartu";
import KanjiKartu from "@/pages/KanjiKartu";
import Dashboard from "@/pages/Dashboard";
import AuthPage from "@/pages/AuthPage";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <AuthProvider>
      <div className="flex min-h-svh flex-col bg-background text-foreground">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 md:pb-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/bab" element={<BabList />} />
            <Route path="/bab/:number" element={<BabDetail />} />
            <Route path="/quiz" element={<QuizSetup />} />
            <Route path="/quiz/play" element={<QuizPlay />} />
            <Route path="/kartu" element={<Kartu />} />
            <Route path="/kanji" element={<KanjiKartu />} />
            <Route path="/progres" element={<Dashboard />} />
            <Route path="/masuk" element={<AuthPage mode="login" />} />
            <Route path="/daftar" element={<AuthPage mode="signup" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Toaster />
      </div>
    </AuthProvider>
  );
}
