import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  draftFromShiftDetail,
  fetchShift,
  shiftTypesFromDetail,
} from "../api/shifts";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AppShell } from "../components/AppShell";
import { ShiftWizardFrame } from "../components/ShiftWizardFrame";
import { settingsHref } from "../lib/settingsReturnTo";
import {
  LAST_WIZARD_STEP_INDEX,
  type NewShiftWizardContext,
} from "../lib/shiftWizard";
import { loadWizardPark, parkWizard } from "../lib/wizardPark";
import type { NewShiftDraft, ShiftTypeMaster } from "../types/shift";

/** 保存済み勤務表の編集ウィザード（初期設定〜シート） */
export function EditShiftLayout() {
  const { shiftId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [draft, setDraftState] = useState<NewShiftDraft | null>(null);
  const [paletteTypes, setPaletteTypes] = useState<ShiftTypeMaster[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const draftRef = useRef<NewShiftDraft | null>(null);
  const unlockedRef = useRef(LAST_WIZARD_STEP_INDEX);

  const setDraft = useCallback((next: NewShiftDraft) => {
    draftRef.current = next;
    setDraftState(next);
  }, []);

  const unlockThrough = useCallback(() => {
    // 編集では全ステップ到達済み
  }, []);

  const parkAndOpenSettings = useCallback(
    (next: NewShiftDraft, returnPath: string) => {
      setDraft(next);
      parkWizard({
        draft: next,
        unlockedStepIndex: LAST_WIZARD_STEP_INDEX,
        setupMode: null,
        returnPath,
      });
      navigate(settingsHref("/settings", returnPath));
    },
    [navigate, setDraft],
  );

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
        const fetched = draftFromShiftDetail(shift);
        const parked = loadWizardPark();
        const next =
          parked?.draft.serverId === id ? parked.draft : fetched;
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
      <ShiftWizardFrame
        unlockedRef={unlockedRef}
        unlockedStepIndex={LAST_WIZARD_STEP_INDEX}
        context={
          {
            draft: draftRef.current ?? draft,
            setDraft,
            cancelPath: "/shifts",
            paletteTypes,
            unlockThrough,
            unlockedStepIndex: LAST_WIZARD_STEP_INDEX,
            setupMode: null,
            setSetupMode: () => {},
            parkAndOpenSettings,
          } satisfies NewShiftWizardContext
        }
      />
    </AppShell>
  );
}
