import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import {
  draftFromShiftDetail,
  fetchShift,
  shiftTypesFromDetail,
} from "../api/shifts";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AppShell } from "../components/AppShell";
import type { NewShiftDraft, ShiftTypeMaster } from "../types/shift";
import type { NewShiftWizardContext } from "./NewShiftLayout";

/** 保存済み勤務表の編集ウィザード（初期設定〜シート） */
export function EditShiftLayout() {
  const { shiftId } = useParams();
  const { token } = useAuth();
  const [draft, setDraftState] = useState<NewShiftDraft | null>(null);
  const [paletteTypes, setPaletteTypes] = useState<ShiftTypeMaster[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const draftRef = useRef<NewShiftDraft | null>(null);

  const setDraft = useCallback((next: NewShiftDraft) => {
    draftRef.current = next;
    setDraftState(next);
  }, []);

  useEffect(() => {
    const id = Number(shiftId);
    if (!token || !Number.isInteger(id) || id <= 0) {
      setError("シフト表が見つかりませんでした");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchShift(token, id)
      .then((shift) => {
        if (cancelled) return;
        const next = draftFromShiftDetail(shift);
        draftRef.current = next;
        setDraftState(next);
        setPaletteTypes(shiftTypesFromDetail(shift));
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(
          caught instanceof ApiError
            ? caught.message
            : "シフト表を読み込めませんでした",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shiftId, token]);

  if (loading) {
    return (
      <AppShell>
        <p className="auth-muted">読み込み中...</p>
      </AppShell>
    );
  }

  if (error || !draft) {
    return (
      <AppShell>
        <div className="shift-list-page">
          <h2>シフト表</h2>
          <p className="auth-error">{error ?? "シフト表が見つかりませんでした"}</p>
          <Link className="btn-secondary" to="/shifts">
            シフト一覧にもどる
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Outlet
        context={
          {
            draft: draftRef.current ?? draft,
            setDraft,
            cancelPath: "/shifts",
            paletteTypes,
          } satisfies NewShiftWizardContext
        }
      />
    </AppShell>
  );
}
