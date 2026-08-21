import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { fetchShifts, type ShiftSummary } from "../api/shifts";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AppShell } from "../components/AppShell";
import { FlashToast, useFlash } from "../components/FlashToast";
import { formatJaDate } from "../lib/date";
import { MAX_SHIFTS } from "../types/shift";

type ShiftsListLocationState = {
  flash?: string;
};

function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

/** 名前・期間（和暦表示と ISO）を部分一致で探す */
function matchesShiftSearch(shift: ShiftSummary, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const haystack = [
    shift.name,
    formatJaDate(shift.start_date),
    formatJaDate(shift.end_date),
    shift.start_date,
    shift.end_date,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(needle);
}

/** 保存済み勤務表の一覧 */
export function ShiftsListPage() {
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { flashMessage, showFlash } = useFlash();
  const [shifts, setShifts] = useState<ShiftSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const flash = (location.state as ShiftsListLocationState | null)?.flash;
  const filtered = useMemo(
    () => (shifts ?? []).filter((shift) => matchesShiftSearch(shift, query)),
    [shifts, query],
  );

  useEffect(() => {
    if (!flash) return;
    showFlash(flash);
    navigate(location.pathname, { replace: true, state: null });
  }, [flash, showFlash, navigate, location.pathname]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    fetchShifts(token)
      .then((rows) => {
        if (!cancelled) {
          setShifts(rows);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(
          caught instanceof ApiError
            ? caught.message
            : "シフト一覧を取得できませんでした",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <AppShell>
      <FlashToast message={flashMessage} />
      <div className="shift-list-page">
        {shifts != null ? (
          <div className="shift-list-page__toolbar">
            <form
              className="shift-list-page__search"
              role="search"
              onSubmit={(event) => event.preventDefault()}
            >
              <label className="visually-hidden" htmlFor="shift-list-search">
                シフト表を検索
              </label>
              <input
                id="shift-list-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="名前または年月日で検索"
                autoComplete="off"
              />
            </form>
            <p className="shift-list-page__count">
              {filtered.length}件({MAX_SHIFTS}件まで作成可能)
            </p>
          </div>
        ) : null}
        {error ? <p className="auth-error">{error}</p> : null}
        {shifts == null && !error ? (
          <p className="auth-muted">読み込み中...</p>
        ) : null}
        {shifts && shifts.length === 0 ? (
          <div className="shift-list-empty">
            <p className="auth-muted">保存したシフト表はまだありません。</p>
            <Link
              className="btn-primary shift-list-empty__action"
              to="/shifts/new"
              state={{ freshWizard: true }}
            >
              新規シフト表作成
            </Link>
          </div>
        ) : null}
        {shifts && shifts.length > 0 && filtered.length === 0 ? (
          <p className="auth-muted">該当するシフト表はありません。</p>
        ) : null}
        {filtered.length > 0 ? (
          <ul className="shift-list">
            {filtered.map((shift) => (
              <li key={shift.id}>
                <Link className="shift-card" to={`/shifts/${shift.id}/sheet`}>
                  <span className="shift-card__name">{shift.name}</span>
                  <span className="shift-card__meta">
                    {formatJaDate(shift.start_date)} 〜 {formatJaDate(shift.end_date)}
                    {shift.updated_at
                      ? ` ／ 最終更新日 ${formatUpdatedAt(shift.updated_at)}`
                      : ""}
                  </span>
                  <span className="shift-card__action">編集する</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </AppShell>
  );
}
