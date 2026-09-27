import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, getAuthToken, setAuthToken } from "@/lib/api";
import type { AuthResponse, UserPublic } from "@/types/japanese";

interface AuthContextValue {
  user: UserPublic | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Optional local-account auth: guests browse everything, only progress needs a session. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["me", token],
    queryFn: () => apiGet<UserPublic>("/auth/me"),
    enabled: token !== null,
    retry: false,
  });

  const applyAuth = useCallback(
    (res: AuthResponse) => {
      setAuthToken(res.token);
      setToken(res.token);
      queryClient.clear();
    },
    [queryClient],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      applyAuth(await apiPost<AuthResponse>("/auth/login", { email, password }));
    },
    [applyAuth],
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      applyAuth(await apiPost<AuthResponse>("/auth/signup", { name, email, password }));
    },
    [applyAuth],
  );

  const logout = useCallback(() => {
    setAuthToken(null);
    setToken(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user: token ? (user ?? null) : null,
      isLoading: token !== null && isLoading,
      login,
      signup,
      logout,
    }),
    [token, user, isLoading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
