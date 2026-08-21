import type { NewShiftDraft } from "../types/shift";
import type { NewShiftSetupMode } from "./shiftWizard";
import { parseSettingsReturnTo } from "./settingsReturnTo";

const STORAGE_KEY = "shiftMaker.wizardPark";

export type WizardPark = {
  draft: NewShiftDraft;
  unlockedStepIndex: number;
  setupMode: NewShiftSetupMode | null;
  returnPath: string;
};

function isDraft(value: unknown): value is NewShiftDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as NewShiftDraft;
  return (
    typeof draft.name === "string" &&
    typeof draft.startDate === "string" &&
    typeof draft.endDate === "string" &&
    Array.isArray(draft.staff)
  );
}

function isPark(value: unknown): value is WizardPark {
  if (!value || typeof value !== "object") return false;
  const park = value as WizardPark;
  return (
    isDraft(park.draft) &&
    typeof park.unlockedStepIndex === "number" &&
    typeof park.returnPath === "string" &&
    parseSettingsReturnTo(park.returnPath) != null
  );
}

/** 設定へ行く前にウィザード下書きを退避する */
export function parkWizard(park: WizardPark): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(park));
  } catch {
    // 保存できない場合は遷移先で下書きが消える
  }
}

/** 退避したウィザード下書きを読む */
export function loadWizardPark(): WizardPark | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isPark(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** 退避したウィザード下書きを捨てる */
export function clearWizardPark(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // 削除できない場合は次回の読み取りで上書きする
  }
}

export function isNewWizardPark(park: WizardPark): boolean {
  return park.returnPath.startsWith("/shifts/new/");
}
