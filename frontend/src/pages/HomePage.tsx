import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function SidebarToggleIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {open ? (
        // 開いているとき: 左矢印（閉じる）
        <path
          fill="currentColor"
          d="M14.7 6.3a1 1 0 0 1 0 1.4L10.4 12l4.3 4.3a1 1 0 0 1-1.4 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.4 0Z"
        />
      ) : (
        // 閉じているとき: 右矢印（開く）
        <path
          fill="currentColor"
          d="M9.3 6.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4l4.3-4.3-4.3-4.3a1 1 0 0 1 0-1.4Z"
        />
      )}
    </svg>
  );
}

/** 完成図の認証後シェル（サイドバー付き）。業務機能は後続実装 */
export function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div
      className={
        sidebarOpen ? "app-shell" : "app-shell app-shell--sidebar-collapsed"
      }
    >
      <aside className="app-shell__sidebar">
        <div className="app-shell__sidebar-top">
          {sidebarOpen ? (
            <Link className="app-shell__brand is-active" to="/home">
              Shift Maker
            </Link>
          ) : null}
          <button
            type="button"
            className="app-shell__sidebar-toggle"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
            aria-expanded={sidebarOpen}
          >
            <SidebarToggleIcon open={sidebarOpen} />
          </button>
        </div>
        {sidebarOpen ? (
          <nav>
            <span className="nav-disabled">シフト一覧</span>
            <span className="nav-disabled">新規シフト作成</span>
            <span className="nav-disabled">設定</span>
            <button
              type="button"
              className="app-shell__nav-item"
              onClick={handleLogout}
            >
              ログアウト
            </button>
          </nav>
        ) : null}
      </aside>
      <main className="app-shell__main">
        <header className="app-shell__header">
          <h1>{user?.name || "ユーザー"}さんのページ</h1>
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
