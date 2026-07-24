import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../api/auth";
import { ApiError } from "../api/client";
import { AuthLayout } from "../components/AuthLayout";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const result = await requestPasswordReset(email);
      setMessage(
        `${result.message}（開発環境では backend/tmp/mail を確認してください）`,
      );
    } catch (err) {
      if (err instanceof ApiError) {
        const details = err.body.errors?.join(" / ");
        setError(details || err.message || "送信に失敗しました");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("送信に失敗しました");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="パスワード再設定"
      footer={<Link to="/login">ログインへ</Link>}
    >
      <p className="auth-muted">
        登録済みのメールアドレスを入力してください。再設定用のリンクを送信します。
      </p>
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
        {error ? <p className="auth-error">{error}</p> : null}
        {message ? <p className="auth-success">{message}</p> : null}
        <button type="submit" disabled={submitting}>
          {submitting ? "送信中..." : "再設定メールを送る"}
        </button>
      </form>
    </AuthLayout>
  );
}
