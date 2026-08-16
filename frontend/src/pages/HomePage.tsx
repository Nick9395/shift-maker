import { useAuth } from "../auth/AuthContext";
import { AppShell } from "../components/AppShell";

/** 完成図の認証後ホーム（業務機能は後続実装） */
export function HomePage() {
  const { user } = useAuth();

  return (
    <AppShell>
      <p>
        ログイン中: <strong>{user?.email}</strong>
      </p>
      <p className="auth-muted">
        認証機能の動作確認用画面です。完成図の業務画面は今後追加します。
      </p>
    </AppShell>
  );
}
