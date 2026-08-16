import { Link } from "react-router-dom";
import { AppShell } from "../components/AppShell";

const SETTINGS_ITEMS = [
  { to: "/settings/duties", label: "職務を登録する" },
  { to: "/settings/staff", label: "職員を登録する" },
  { to: "/settings/shift-types", label: "シフトの種類を登録する" },
  { to: "/settings/account", label: "アカウント設定" },
] as const;

/** 各種設定の選択画面 */
export function SettingsPage() {
  return (
    <AppShell>
      <div className="settings-page">
        <h2>設定</h2>
        <nav className="settings-menu" aria-label="設定項目">
          {SETTINGS_ITEMS.map((item) => (
            <Link key={item.to} className="settings-menu__item" to={item.to}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </AppShell>
  );
}
