import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout } from "../components/AuthLayout";

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signup(name, email, password, passwordConfirmation);
      navigate("/home", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        const details = err.body.errors?.join(" / ");
        setError(details || err.message || "サインアップに失敗しました");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("サインアップに失敗しました");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="サインアップ"
      footer={<Link to="/login">ログインへ</Link>}
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          ユーザー名
          <input
            type="text"
            autoComplete="nickname"
            required
            minLength={1}
            maxLength={12}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
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
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label>
          パスワード（確認）
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
          />
        </label>
        {error ? <p className="auth-error">{error}</p> : null}
        <button type="submit" disabled={submitting}>
          {submitting ? "送信中..." : "登録する"}
        </button>
      </form>
    </AuthLayout>
  );
}
