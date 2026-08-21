import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { AppShell } from "../components/AppShell";
import { ShiftWizardFrame } from "../components/ShiftWizardFrame";
import { settingsHref } from "../lib/settingsReturnTo";
import {
  isAtShiftCreateLimit,
  SHIFT_CREATE_LIMIT_MESSAGE,
} from "../lib/shiftLimit";
import {
  type NewShiftSetupMode,
  type NewShiftWizardContext,
  type WizardStepId,
  wizardStepIndex,
} from "../lib/shiftWizard";
import {
  clearWizardPark,
  isNewWizardPark,
  loadWizardPark,
  parkWizard,
} from "../lib/wizardPark";
import type { NewShiftDraft } from "../types/shift";

export type { NewShiftWizardContext };

type LocationState = {
  freshWizard?: boolean;
};

/** 新規シフト表作成ウィザードの親（入力値を画面間で保持する） */
export function NewShiftLayout() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const freshWizard = Boolean(
    (location.state as LocationState | null)?.freshWizard,
  );
  const initialPark =
    !freshWizard ? (() => {
      const parked = loadWizardPark();
      return parked && isNewWizardPark(parked) ? parked : null;
    })() : null;

  const [draft, setDraftState] = useState<NewShiftDraft | null>(
    () => initialPark?.draft ?? null,
  );
  const [ready, setReady] = useState(false);
  const [unlockedStepIndex, setUnlockedStepIndex] = useState(
    () => initialPark?.unlockedStepIndex ?? 0,
  );
  const [setupMode, setSetupMode] = useState<NewShiftSetupMode | null>(
    () => initialPark?.setupMode ?? null,
  );
  const draftRef = useRef<NewShiftDraft | null>(initialPark?.draft ?? null);
  const unlockedRef = useRef(initialPark?.unlockedStepIndex ?? 0);
  const setupModeRef = useRef<NewShiftSetupMode | null>(
    initialPark?.setupMode ?? null,
  );

  setupModeRef.current = setupMode;

  const setDraft = useCallback((next: NewShiftDraft) => {
    draftRef.current = next;
    setDraftState(next);
  }, []);

  const unlockThrough = useCallback((stepId: WizardStepId) => {
    const index = wizardStepIndex(stepId);
    if (index > unlockedRef.current) {
      unlockedRef.current = index;
      setUnlockedStepIndex(index);
    }
  }, []);

  const parkAndOpenSettings = useCallback(
    (next: NewShiftDraft, returnPath: string) => {
      setDraft(next);
      parkWizard({
        draft: next,
        unlockedStepIndex: unlockedRef.current,
        setupMode: setupModeRef.current,
        returnPath,
      });
      navigate(settingsHref("/settings", returnPath));
    },
    [navigate, setDraft],
  );

  useEffect(() => {
    if (!freshWizard) return;
    clearWizardPark();
    draftRef.current = null;
    setDraftState(null);
    unlockedRef.current = 0;
    setUnlockedStepIndex(0);
    setSetupMode(null);
    navigate(location.pathname, { replace: true, state: {} });
  }, [freshWizard, location.pathname, navigate]);

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
      <ShiftWizardFrame
        unlockedRef={unlockedRef}
        unlockedStepIndex={unlockedStepIndex}
        context={
          {
            draft: draftRef.current ?? draft,
            setDraft,
            cancelPath: "/home",
            unlockThrough,
            unlockedStepIndex,
            setupMode,
            setSetupMode,
            parkAndOpenSettings,
          } satisfies NewShiftWizardContext
        }
      />
    </AppShell>
  );
}
