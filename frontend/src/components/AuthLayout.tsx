import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type AuthLayoutProps = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthLayout({ title, children, footer }: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <header className="auth-card__header">
          <h1>{title}</h1>
        </header>
        <div className="auth-card__body">{children}</div>
        <footer className="auth-card__footer">
          {footer}
          <Link to="/">トップへ戻る</Link>
        </footer>
      </div>
    </div>
  );
}
