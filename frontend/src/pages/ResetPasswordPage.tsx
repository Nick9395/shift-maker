import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth";
import { ApiError } from "../api/client";
import { AuthLayout } from "../components/AuthLayout";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("reset_password_token") || "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("リセットトークンが見つかりません。メールのリンクから再度開いてください。");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword({
        resetPasswordToken: token,
        password,
        passwordConfirmation,
      });
      navigate("/login", {
        replace: true,
        state: { notice: "パスワードを更新しました。ログインしてください。" },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        const details = err.body.errors?.join(" / ");
        setError(details || err.message || "更新に失敗しました");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("更新に失敗しました");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="新しいパスワード"
      footer={<Link to="/login">ログインへ</Link>}
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          新しいパスワード
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
          新しいパスワード（確認）
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
          {submitting ? "送信中..." : "パスワードを更新"}
        </button>
      </form>
    </AuthLayout>
  );
}
