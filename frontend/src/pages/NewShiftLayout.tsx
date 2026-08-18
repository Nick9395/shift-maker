import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { AppShell } from "../components/AppShell";
import {
  isAtShiftCreateLimit,
  SHIFT_CREATE_LIMIT_MESSAGE,
} from "../lib/shiftLimit";
import type { NewShiftDraft, ShiftTypeMaster } from "../types/shift";

export type NewShiftWizardContext = {
  draft: NewShiftDraft | null;
  setDraft: (draft: NewShiftDraft) => void;
  cancelPath?: string;
  paletteTypes?: ShiftTypeMaster[] | null;
};

/** 新規シフト表作成ウィザードの親（入力値を画面間で保持する） */
export function NewShiftLayout() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [draft, setDraftState] = useState<NewShiftDraft | null>(null);
  const [ready, setReady] = useState(false);
  const draftRef = useRef<NewShiftDraft | null>(null);

  const setDraft = useCallback((next: NewShiftDraft) => {
    draftRef.current = next;
    setDraftState(next);
  }, []);

  useEffect(() => {
    if (!token) {
      setReady(true);
      return;
    }

    let cancelled = false;
    isAtShiftCreateLimit(token)
      .then((atLimit) => {
        if (cancelled) return;
        if (atLimit) {
          navigate("/shifts", {
            replace: true,
            state: { flash: SHIFT_CREATE_LIMIT_MESSAGE },
          });
          return;
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  if (!ready) {
    return (
      <AppShell>
        <p className="auth-muted">読み込み中...</p>
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
            cancelPath: "/home",
          } satisfies NewShiftWizardContext
        }
      />
    </AppShell>
  );
}
