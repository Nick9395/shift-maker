import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchShifts, type ShiftSummary } from "../api/shifts";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AppShell } from "../components/AppShell";
import { formatJaDate } from "../lib/date";

function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

/** 保存済み勤務表の一覧 */
export function ShiftsListPage() {
  const { token } = useAuth();
  const [shifts, setShifts] = useState<ShiftSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      <div className="shift-list-page">
        <h2>シフト一覧</h2>
        {error ? <p className="auth-error">{error}</p> : null}
        {shifts == null && !error ? (
          <p className="auth-muted">読み込み中...</p>
        ) : null}
        {shifts && shifts.length === 0 ? (
          <div className="shift-list-empty">
            <p className="auth-muted">保存したシフト表はまだありません。</p>
            <Link className="btn-primary shift-list-empty__action" to="/shifts/new">
              新規シフト作成
            </Link>
          </div>
        ) : null}
        {shifts && shifts.length > 0 ? (
          <ul className="shift-list">
            {shifts.map((shift) => (
              <li key={shift.id}>
                <Link className="shift-list__item" to={`/shifts/${shift.id}/sheet`}>
                  <span className="shift-list__name">{shift.name}</span>
                  <span className="shift-list__meta">
                    {formatJaDate(shift.start_date)} 〜 {formatJaDate(shift.end_date)}
                    {shift.updated_at
                      ? ` ／ 更新 ${formatUpdatedAt(shift.updated_at)}`
                      : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </AppShell>
  );
}
