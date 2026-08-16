/** 1シフトに登録できる職員の上限 */
export const MAX_SHIFT_STAFF = 60;

/** 新規シフトに割り当てる職員（職務は手入力。将来は設定から選択） */
export type ShiftStaffDraft = {
  id: string;
  name: string;
  duty1: string;
  duty2: string;
  duty3: string;
};

/** 職務者カウント設定（職務はマスタから選択。マスタ未実装のため dutyId は空） */
export type DutyCountDraft = {
  id: string;
  dutyId: string;
  overlapCount: boolean;
  priority: boolean;
  requiredCount: string;
  shortageNotice: boolean;
};

/** シフト種別マスタの上限 */
export const MAX_SHIFT_TYPES = 20;

/** シフト種別（設定画面のマスタ。未実装のため空） */
export type ShiftTypeMaster = {
  id: string;
  name: string;
  abbreviation: string;
};

export const SHIFT_TYPE_MASTER: readonly ShiftTypeMaster[] = [];

/** シフト表上の手入力・ロック状態 */
export type ShiftSheetDraft = {
  plans: Record<string, string>;
  cells: Record<string, string>;
  lockedShiftTypeIds: string[];
  allLocked: boolean;
};

export function createEmptySheet(): ShiftSheetDraft {
  return {
    plans: {},
    cells: {},
    lockedShiftTypeIds: [],
    allLocked: false,
  };
}

export function sheetCellKey(staffId: string, isoDate: string): string {
  return `${staffId}:${isoDate}`;
}

/** 新規シフト作成ウィザードの入力途中データ */
export type NewShiftDraft = {
  name: string;
  startDate: string;
  endDate: string;
  holidayCount: number;
  staff: ShiftStaffDraft[];
  dutyCounts: DutyCountDraft[];
  sheet: ShiftSheetDraft;
};
