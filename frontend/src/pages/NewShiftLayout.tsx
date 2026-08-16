import { useCallback, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import type { NewShiftDraft, ShiftTypeMaster } from "../types/shift";

export type NewShiftWizardContext = {
  draft: NewShiftDraft | null;
  setDraft: (draft: NewShiftDraft) => void;
  cancelPath?: string;
  paletteTypes?: ShiftTypeMaster[] | null;
};

/** 新規シフト作成ウィザードの親（入力値を画面間で保持する） */
export function NewShiftLayout() {
  const [draft, setDraftState] = useState<NewShiftDraft | null>(null);
  const draftRef = useRef<NewShiftDraft | null>(null);

  const setDraft = useCallback((next: NewShiftDraft) => {
    draftRef.current = next;
    setDraftState(next);
  }, []);

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
