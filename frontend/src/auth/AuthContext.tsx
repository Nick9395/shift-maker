import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "../api/auth";
import {
  LOGIN_WELCOME_DURATION_MS,
  pickLoginWelcome,
  type LoginWelcomeMessage,
} from "../lib/loginWelcome";
import type { AuthUser } from "../types/auth";
import { setLastLoginEmail } from "./lastLoginEmail";
import { clearToken, getToken, setToken } from "./token";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  welcomeMessage: LoginWelcomeMessage | null;
  updateAccount: (params: {
    name: string;
    email: string;
    currentPassword: string;
    password?: string;
    passwordConfirmation?: string;
  }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [loading, setLoading] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState<LoginWelcomeMessage | null>(
    null,
  );
  const welcomeTimerRef = useRef(0);

  const clearWelcomeMessage = useCallback(() => {
    window.clearTimeout(welcomeTimerRef.current);
    setWelcomeMessage(null);
  }, []);

  const showLoginWelcome = useCallback((name: string) => {
    window.clearTimeout(welcomeTimerRef.current);
    setWelcomeMessage(pickLoginWelcome(name));
    welcomeTimerRef.current = window.setTimeout(() => {
      setWelcomeMessage(null);
    }, LOGIN_WELCOME_DURATION_MS);
  }, []);

  const refreshMe = useCallback(async () => {
    const current = getToken();
    if (!current) {
      setUser(null);
      setTokenState(null);
      return;
    }

    try {
      const data = await authApi.fetchMe(current);
      setUser(data.user);
      setTokenState(current);
    } catch {
      clearToken();
      setUser(null);
      setTokenState(null);
    }
  }, []);

  useEffect(() => {
    refreshMe().finally(() => setLoading(false));
  }, [refreshMe]);

  useEffect(() => {
    return () => {
      window.clearTimeout(welcomeTimerRef.current);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login({ email, password });
    setToken(result.token);
    setTokenState(result.token);
    setUser(result.user);
    showLoginWelcome(result.user.name);
  }, [showLoginWelcome]);

  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      passwordConfirmation: string,
    ) => {
      const result = await authApi.signup({
        name,
        email,
        password,
        passwordConfirmation,
      });
      setToken(result.token);
      setTokenState(result.token);
      setUser(result.user);
    },
    [],
  );

  const updateAccount = useCallback(
    async (params: {
      name: string;
      email: string;
      currentPassword: string;
      password?: string;
      passwordConfirmation?: string;
    }) => {
      const current = getToken();
      if (!current) {
        throw new Error("ログインが必要です");
      }
      const data = await authApi.updateMe(current, params);
      setUser(data.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    // ProtectedRoute が state なしで /login へ飛ばす競合に備え、先に退避する
    if (user?.email) {
      setLastLoginEmail(user.email);
    }

    const current = getToken();
    if (current) {
      try {
        await authApi.logout(current);
      } catch {
        // サーバー側で失効済みでもローカルはクリアする
      }
    }
    clearToken();
    setTokenState(null);
    setUser(null);
    clearWelcomeMessage();
  }, [user, clearWelcomeMessage]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      signup,
      logout,
      refreshMe,
      updateAccount,
      welcomeMessage,
    }),
    [
      user,
      token,
      loading,
      login,
      signup,
      logout,
      refreshMe,
      updateAccount,
      welcomeMessage,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth は AuthProvider 内で使用してください");
  }
  return ctx;
}
