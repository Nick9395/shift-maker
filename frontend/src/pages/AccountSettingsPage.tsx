import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AppShell } from "../components/AppShell";
import { FlashToast, useFlash } from "../components/FlashToast";

const NAME_MAX = 12;
const PASSWORD_MIN = 6;

/** ユーザー名・メール・パスワードを更新する */
export function AccountSettingsPage() {
  const navigate = useNavigate();
  const { user, updateAccount } = useAuth();
  const { flashMessage, showFlash } = useFlash();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
  }, [user]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) {
      setError("ユーザー名を入力してください");
      return;
    }
    if (trimmedName.length > NAME_MAX) {
      setError(`ユーザー名は${NAME_MAX}文字以内で入力してください`);
      return;
    }
    if (!trimmedEmail) {
      setError("メールアドレスを入力してください");
      return;
    }
    if (!currentPassword) {
      setError("現在のパスワードを入力してください");
      return;
    }
    if (password || passwordConfirmation) {
      if (password.length < PASSWORD_MIN) {
        setError(`パスワードは${PASSWORD_MIN}文字以上で入力してください`);
        return;
      }
      if (password !== passwordConfirmation) {
        setError("新しいパスワードと確認用パスワードが一致しません");
        return;
      }
    }

    setSaving(true);
    try {
      await updateAccount({
        name: trimmedName,
        email: trimmedEmail,
        currentPassword,
        ...(password
          ? { password, passwordConfirmation }
          : {}),
      });
      setCurrentPassword("");
      setPassword("");
      setPasswordConfirmation("");
      showFlash("保存しました");
    } catch (caught: unknown) {
      if (caught instanceof ApiError) {
        const details = caught.body.errors?.join(" / ");
        setError(details || caught.message || "アカウント情報の更新に失敗しました");
      } else if (caught instanceof Error) {
        setError(caught.message);
      } else {
        setError("アカウント情報の更新に失敗しました");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <FlashToast message={flashMessage} />
      <div className="shift-form-page">
        <form className="shift-form" onSubmit={handleSubmit} noValidate>
          <label>
            ユーザー名
            <input
              type="text"
              autoComplete="nickname"
              required
              maxLength={NAME_MAX}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            メールアドレス
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            現在のパスワード
            <input
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </label>

          <div className="account-form__section">
            <p className="account-form__note">
              パスワードを変更する場合のみ入力してください。
            </p>
            <label>
              新しいパスワード
              <input
                type="password"
                autoComplete="new-password"
                minLength={PASSWORD_MIN}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <label>
              新しいパスワード（確認）
              <input
                type="password"
                autoComplete="new-password"
                minLength={PASSWORD_MIN}
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
              />
            </label>
          </div>

          {error ? <p className="auth-error">{error}</p> : null}

          <div className="shift-form__actions account-form__actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/settings")}
              disabled={saving}
            >
              もどる
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
