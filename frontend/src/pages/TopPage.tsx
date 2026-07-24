import { Link } from "react-router-dom";

function StartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm-1.2 5.4h2.4v4.2H17v2.4h-4.2V18h-2.4v-4.2H7.4v-2.4h3.4Z"
      />
    </svg>
  );
}

function LoginIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.3 0-8 1.7-8 5v1h16v-1c0-3.3-4.7-5-8-5Z"
      />
    </svg>
  );
}

function TermsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V8h4.5L14 3.5ZM8 11h8v2H8v-2Zm0 4h8v2H8v-2Zm0 4h5v2H8v-2Z"
      />
    </svg>
  );
}

const actions = [
  { to: "/signup", label: "利用開始", Icon: StartIcon },
  { to: "/login", label: "ログイン", Icon: LoginIcon },
  { to: "/terms", label: "利用規約", Icon: TermsIcon },
] as const;

export function TopPage() {
  return (
    <div className="top-page">
      <div className="top-page__glow" aria-hidden="true" />
      <header className="top-page__brand">
        <p className="top-page__eyebrow">シフト管理をもっとシンプルに</p>
        <h1>Shift Maker</h1>
      </header>

      <nav className="top-page__actions" aria-label="メインメニュー">
        {actions.map(({ to, label, Icon }) => (
          <Link key={to} to={to} className="top-action">
            <span className="top-action__icon">
              <Icon />
            </span>
            <span className="top-action__label">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
