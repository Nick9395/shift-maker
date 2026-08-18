import { useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function BrandMark() {
  return (
    <svg className="app-shell__brand-mark" viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="currentColor" />
      <path
        fill="#241f1c"
        d="M7 8.2h10v1.7H7zm0 3.1h10v1.7H7zm0 3.1h6.5v1.7H7z"
      />
    </svg>
  );
}

function SidebarToggleIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {open ? (
        <path
          fill="currentColor"
          d="M14.7 6.3a1 1 0 0 1 0 1.4L10.4 12l4.3 4.3a1 1 0 0 1-1.4 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.4 0Z"
        />
      ) : (
        <path
          fill="currentColor"
          d="M9.3 6.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4l4.3-4.3-4.3-4.3a1 1 0 0 1 0-1.4Z"
        />
      )}
    </svg>
  );
}

type AppShellProps = {
  children: ReactNode;
};

/** 認証後の共通シェル（サイドバー付き） */
export function AppShell({ children }: AppShellProps) {
  const { user, logout, welcomeMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isSheetPage =
    location.pathname === "/shifts/new/sheet" ||
    /^\/shifts\/\d+\/sheet$/.test(location.pathname);

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
            <Link className="app-shell__brand" to="/home">
              <BrandMark />
              <span className="app-shell__brand-text">
                <span className="app-shell__brand-shift">Shift</span>
                <span className="app-shell__brand-maker">Maker</span>
              </span>
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
            <NavLink
              to="/shifts"
              end
              className={({ isActive }) => (isActive ? "is-active" : undefined)}
            >
              シフト一覧
            </NavLink>
            <NavLink
              to="/shifts/new"
              className={({ isActive }) => (isActive ? "is-active" : undefined)}
            >
              新規シフト作成
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) => (isActive ? "is-active" : undefined)}
            >
              設定
            </NavLink>
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
        {isSheetPage ? null : (
          <header className="app-shell__header">
            <h1 aria-hidden={welcomeMessage ? true : undefined}>
              <span className="app-shell__header-name">
                {user?.name || "ユーザー"}さん
              </span>
              <span className="app-shell__header-sep" aria-hidden="true" />
              <span className="app-shell__header-page">のページ</span>
            </h1>
            {welcomeMessage ? (
              <p className="app-shell__welcome" role="status" aria-live="polite">
                <span className="app-shell__welcome-name">
                  {welcomeMessage.name}さん
                </span>
                <span className="app-shell__welcome-sep" aria-hidden="true" />
                <span className="app-shell__welcome-body">
                  {welcomeMessage.body}
                </span>
              </p>
            ) : null}
          </header>
        )}
        <section
          className={
            isSheetPage
              ? "app-shell__content app-shell__content--sheet"
              : "app-shell__content"
          }
        >
          {children}
        </section>
      </main>
    </div>
  );
}
