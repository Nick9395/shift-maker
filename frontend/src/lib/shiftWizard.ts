import { useParams } from "react-router-dom";
import type { NewShiftDraft, ShiftTypeMaster } from "../types/shift";

export const WIZARD_STEPS = [
  { id: "setup", label: "初期設定", pathKey: "root" },
  { id: "staff", label: "職員設定", pathKey: "staff" },
  { id: "duties", label: "職務カウント", pathKey: "duties" },
  { id: "shiftCounts", label: "シフトカウント", pathKey: "shiftCounts" },
  { id: "sheet", label: "シフト表編集", pathKey: "sheet" },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

export const LAST_WIZARD_STEP_INDEX = WIZARD_STEPS.length - 1;

/** 新規作成と保存済み編集で、ウィザード各画面のパスを切り替える */
export function shiftWizardPaths(serverId?: number) {
  const base = serverId != null ? `/shifts/${serverId}` : "/shifts/new";
  return {
    root: base,
    staff: `${base}/staff`,
    duties: `${base}/duties`,
    shiftCounts: `${base}/shift-counts`,
    sheet: `${base}/sheet`,
  };
}

export type ShiftWizardPaths = ReturnType<typeof shiftWizardPaths>;

/** 今のURLが編集か新規かで、ウィザードの遷移先を決める */
export function useShiftWizardPaths() {
  const { shiftId } = useParams();
  const parsed = Number(shiftId);
  const serverId =
    Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  return {
    ...shiftWizardPaths(serverId),
    isEdit: serverId != null,
  };
}

export function wizardStepIndex(id: WizardStepId): number {
  return WIZARD_STEPS.findIndex((step) => step.id === id);
}

export function wizardStepFromPath(pathname: string): WizardStepId | null {
  if (pathname === "/shifts/new" || /^\/shifts\/\d+$/.test(pathname)) {
    return "setup";
  }
  if (
    pathname === "/shifts/new/staff" ||
    /^\/shifts\/\d+\/staff$/.test(pathname)
  ) {
    return "staff";
  }
  if (
    pathname === "/shifts/new/duties" ||
    /^\/shifts\/\d+\/duties$/.test(pathname)
  ) {
    return "duties";
  }
  if (
    pathname === "/shifts/new/shift-counts" ||
    /^\/shifts\/\d+\/shift-counts$/.test(pathname)
  ) {
    return "shiftCounts";
  }
  if (
    pathname === "/shifts/new/sheet" ||
    /^\/shifts\/\d+\/sheet$/.test(pathname)
  ) {
    return "sheet";
  }
  return null;
}

export function pathForWizardStep(
  paths: ShiftWizardPaths,
  stepId: WizardStepId,
): string {
  const step = WIZARD_STEPS.find((item) => item.id === stepId);
  return step ? paths[step.pathKey] : paths.root;
}

export type NewShiftSetupMode = "scratch" | "copy";

export type NewShiftWizardContext = {
  draft: NewShiftDraft | null;
  setDraft: (draft: NewShiftDraft) => void;
  cancelPath?: string;
  paletteTypes?: ShiftTypeMaster[] | null;
  unlockThrough: (stepId: WizardStepId) => void;
  unlockedStepIndex: number;
  setupMode: NewShiftSetupMode | null;
  setSetupMode: (mode: NewShiftSetupMode) => void;
  parkAndOpenSettings: (draft: NewShiftDraft, returnPath: string) => void;
};
