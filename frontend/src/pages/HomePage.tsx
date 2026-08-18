import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchShifts, type ShiftSummary } from "../api/shifts";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AppShell } from "../components/AppShell";
import { formatJaDate } from "../lib/date";
import { splitHomeShifts } from "../lib/homeShifts";

function formatStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function ShiftMeta({ shift }: { shift: ShiftSummary }) {
  return (
    <span className="shift-card__meta">
      {formatJaDate(shift.start_date)} 〜 {formatJaDate(shift.end_date)}
      {shift.updated_at ? ` ／ 最終更新日 ${formatStamp(shift.updated_at)}` : ""}
    </span>
  );
}

/** ログイン後ホーム（最後に更新した勤務表と最近編集した勤務表） */
export function HomePage() {
  const { token } = useAuth();
  const [shifts, setShifts] = useState<ShiftSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    fetchShifts(token)
      .then((rows) => {
        if (cancelled) return;
        setShifts(rows);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(
          caught instanceof ApiError
            ? caught.message
            : "シフト表を読み込めませんでした",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const { latestUpdated, recent } = useMemo(
    () => splitHomeShifts(shifts ?? []),
    [shifts],
  );

  return (
    <AppShell>
      <div className="home-page">
        {error ? <p className="auth-error">{error}</p> : null}
        {shifts == null && !error ? (
          <p className="auth-muted">読み込み中...</p>
        ) : null}

        {shifts && shifts.length === 0 ? (
          <div className="home-empty">
            <p>現在作成したシフト表はありません</p>
            <Link className="btn-primary home-empty__action" to="/shifts/new">
              新規シフト表作成
            </Link>
          </div>
        ) : null}

        {latestUpdated ? (
          <section className="home-section" aria-labelledby="home-latest-heading">
            <h2 id="home-latest-heading" className="home-kicker">
              最後に更新したシフト表
            </h2>
            <Link
              className="shift-card shift-card--hero"
              to={`/shifts/${latestUpdated.id}/sheet`}
            >
              <span className="shift-card__name">{latestUpdated.name}</span>
              <ShiftMeta shift={latestUpdated} />
              <span className="shift-card__action">編集する</span>
            </Link>
          </section>
        ) : null}

        {recent.length > 0 ? (
          <section className="home-section" aria-labelledby="home-recent-heading">
            <div className="home-section__head">
              <h2 id="home-recent-heading" className="home-kicker">
                最近編集したシフト表
              </h2>
              <Link className="home-section__more" to="/shifts">
                すべて見る
              </Link>
            </div>
            <ul className="home-recent">
              {recent.map((shift) => (
                <li key={shift.id}>
                  <Link
                    className="shift-card"
                    to={`/shifts/${shift.id}/sheet`}
                  >
                    <span className="shift-card__name">{shift.name}</span>
                    <ShiftMeta shift={shift} />
                    <span className="shift-card__action">編集する</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
