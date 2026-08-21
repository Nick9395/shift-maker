import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import {
  settingsHref,
  useSettingsReturnTo,
} from "../lib/settingsReturnTo";

const SETTINGS_ITEMS = [
  { to: "/settings/duties", label: "職務を登録する" },
  { to: "/settings/staff", label: "職員を登録する" },
  { to: "/settings/shift-types", label: "シフト種別を登録する" },
  { to: "/settings/account", label: "アカウント設定" },
] as const;

/** 各種設定の選択画面 */
export function SettingsPage() {
  const navigate = useNavigate();
  const returnTo = useSettingsReturnTo();

  return (
    <AppShell>
      <div className="settings-page">
        <nav className="settings-menu" aria-label="設定項目">
          {SETTINGS_ITEMS.map((item) => (
            <Link
              key={item.to}
              className="settings-menu__item"
              to={
                item.to === "/settings/account"
                  ? item.to
                  : settingsHref(item.to, returnTo)
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="settings-page__actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(returnTo ?? "/home")}
          >
            {returnTo ? "編集画面にもどる" : "もどる"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
