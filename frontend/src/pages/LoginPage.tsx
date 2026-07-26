import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { getLastLoginEmail } from "../auth/lastLoginEmail";
import { AuthLayout } from "../components/AuthLayout";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState =
    (location.state as { notice?: string; email?: string } | null) ?? null;
  const notice = locationState?.notice ?? null;
  const [email, setEmail] = useState(
    () => locationState?.email || getLastLoginEmail(),
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/home", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "ログインに失敗しました");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("ログインに失敗しました");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="ログイン"
      footer={
        <>
          <Link to="/signup">アカウントを作成</Link>
          <Link to="/password/forgot">パスワードを忘れた場合</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          メールアドレス
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          パスワード
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {notice ? <p className="auth-success">{notice}</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}
        <button type="submit" disabled={submitting}>
          {submitting ? "送信中..." : "ログイン"}
        </button>
      </form>
    </AuthLayout>
  );
}
