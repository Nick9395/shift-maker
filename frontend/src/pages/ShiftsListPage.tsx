import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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

/** 保存済み勤務表の一覧 */
export function ShiftsListPage() {
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { flashMessage, showFlash } = useFlash();
  const [shifts, setShifts] = useState<ShiftSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const flash = (location.state as ShiftsListLocationState | null)?.flash;

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
        <div className="shift-list-page__title">
          <h2>シフト表一覧</h2>
          {shifts != null ? (
            <p className="shift-list-page__count">
              {shifts.length}/{MAX_SHIFTS}
            </p>
          ) : null}
        </div>
        {error ? <p className="auth-error">{error}</p> : null}
        {shifts == null && !error ? (
          <p className="auth-muted">読み込み中...</p>
        ) : null}
        {shifts && shifts.length === 0 ? (
          <div className="shift-list-empty">
            <p className="auth-muted">保存したシフト表はまだありません。</p>
            <Link className="btn-primary shift-list-empty__action" to="/shifts/new">
              新規シフト表作成
            </Link>
          </div>
        ) : null}
        {shifts && shifts.length > 0 ? (
          <ul className="shift-list">
            {shifts.map((shift) => (
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
