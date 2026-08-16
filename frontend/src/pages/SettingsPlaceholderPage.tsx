import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";

type SettingsPlaceholderPageProps = {
  title: string;
};

/** 各設定画面（中身は後続実装） */
export function SettingsPlaceholderPage({ title }: SettingsPlaceholderPageProps) {
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className="settings-page">
        <h2>{title}</h2>
        <p className="auth-muted">この画面は次のステップで実装します。</p>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate("/settings")}
        >
          設定にもどる
        </button>
      </div>
    </AppShell>
  );
}
