import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/** 完成図の認証後シェル（サイドバー付き）。業務機能は後続実装 */
export function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <div className="app-shell__brand">Shift Maker</div>
        <nav>
          <Link className="is-active" to="/home">
            ホーム
          </Link>
          <span className="nav-disabled">シフト一覧（準備中）</span>
          <span className="nav-disabled">設定（準備中）</span>
        </nav>
        <button type="button" className="logout-button" onClick={handleLogout}>
          ログアウト
        </button>
      </aside>
      <main className="app-shell__main">
        <header className="app-shell__header">
          <h1>ホーム</h1>
        </header>
        <section className="app-shell__content">
          <p>
            ログイン中: <strong>{user?.email}</strong>
          </p>
          <p className="auth-muted">
            認証機能の動作確認用画面です。完成図の業務画面は今後追加します。
          </p>
        </section>
      </main>
    </div>
  );
}
