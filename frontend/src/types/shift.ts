/** 1シフトに登録できる職員の上限 */
export const MAX_SHIFT_STAFF = 60;

/** 1ユーザーが保存できるシフト表の上限 */
export const MAX_SHIFTS = 30;

/** シフト表の名前の最大文字数 */
export const MAX_SHIFT_NAME = 40;

/** 職員氏名の最大文字数 */
export const MAX_STAFF_NAME = 30;

/** 設定画面の職員マスタ */
export type StaffMaster = {
  id: string;
  name: string;
};

export function createEmptyStaff(): StaffMaster {
  return {
    id: crypto.randomUUID(),
    name: "",
  };
}

/** 職務名の最大文字数 */
export const MAX_DUTY_NAME = 20;

/** 設定画面の職務マスタ上限 */
export const MAX_DUTIES = 30;

/** 設定画面の職務マスタ */
export type DutyMaster = {
  id: string;
  name: string;
  abbreviation: string;
};

export function createEmptyDuty(): DutyMaster {
  return {
    id: crypto.randomUUID(),
    name: "",
    abbreviation: "",
  };
}

/** 新規シフトに割り当てる職員（氏名はマスタ選択または手入力。職務はマスタから選択） */
export type ShiftStaffDraft = {
  id: string;
  name: string;
  duty1: string;
  duty2: string;
  duty3: string;
};

/** 職務者カウント設定（職務はマスタから選択） */
export type DutyCountDraft = {
  id: string;
  dutyId: string;
  overlapCount: boolean;
  priority: boolean;
  requiredCount: string;
  shortageNotice: boolean;
};

/** シフトカウント名の最大文字数 */
export const MAX_SHIFT_COUNT_NAME = 20;

/** シフトカウント設定（名は手入力、種別はマスタから選択） */
export type ShiftCountDraft = {
  id: string;
  name: string;
  shiftTypeIds: string[];
  requiredCount: string;
  shortageNotice: boolean;
};

/** シフト種別名の最大文字数 */
export const MAX_SHIFT_TYPE_NAME = 20;

/** シフト種別マスタの上限 */
export const MAX_SHIFT_TYPES = 30;

export const SHIFT_TYPE_CATEGORIES = [
  "公休",
  "特休",
  "年休",
  "出張",
  "時間休",
  "早朝勤務",
  "日中勤務",
  "夕方勤務",
  "夜間勤務",
] as const;

export type ShiftTypeCategory = (typeof SHIFT_TYPE_CATEGORIES)[number];

export const SHIFT_TYPE_COLORS = [
  "赤",
  "オレンジ",
  "黄",
  "緑",
  "青",
  "紫",
  "灰",
] as const;

export type ShiftTypeColor = (typeof SHIFT_TYPE_COLORS)[number];

export const SHIFT_TYPE_COLOR_HEX: Record<ShiftTypeColor, string> = {
  赤: "#c62828",
  オレンジ: "#c45c26",
  黄: "#ffff00",
  緑: "#00a300",
  青: "#0055ff",
  紫: "#b000bd",
  灰: "#bdbdbd",
};

const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{6})$/;

/** 保存済みの色名またはHEXを、描画用のHEXに変換する */
export function resolveShiftTypeColor(iconColor: string): string | undefined {
  if (!iconColor) return undefined;
  if (iconColor in SHIFT_TYPE_COLOR_HEX) {
    return SHIFT_TYPE_COLOR_HEX[iconColor as ShiftTypeColor];
  }
  if (HEX_COLOR_PATTERN.test(iconColor)) {
    return iconColor.toLowerCase();
  }
  return undefined;
}

const PRESET_COLOR_HEX = new Set(
  Object.values(SHIFT_TYPE_COLOR_HEX).map((hex) => hex.toLowerCase()),
);

/** 基本5色のいずれかなら true */
export function isPresetShiftTypeColor(iconColor: string): boolean {
  const resolved = resolveShiftTypeColor(iconColor);
  return resolved != null && PRESET_COLOR_HEX.has(resolved.toLowerCase());
}

/** 表示欄の最大幅（半角1・全角2でカウント） */
export const MAX_SHIFT_TYPE_ABBR_WIDTH = 4;

function isHalfWidthChar(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  if (code <= 0x7f) return true;
  if (code >= 0xff61 && code <= 0xff9f) return true;
  return false;
}

function charDisplayWidth(char: string): number {
  return isHalfWidthChar(char) ? 1 : 2;
}

/** 半角1・全角2で数えた表示幅 */
export function textDisplayWidth(value: string): number {
  let width = 0;
  for (const char of value) {
    width += charDisplayWidth(char);
  }
  return width;
}

/** 表示文字列の幅（半角4文字＝全角2文字） */
export function shiftTypeAbbrWidth(value: string): number {
  return textDisplayWidth(value);
}

export function isValidShiftTypeAbbr(value: string): boolean {
  return shiftTypeAbbrWidth(value) <= MAX_SHIFT_TYPE_ABBR_WIDTH;
}

/** 職務略称の最大幅（全角3文字＝半角6） */
export const MAX_DUTY_ABBR_WIDTH = 6;

export function isValidDutyAbbr(value: string): boolean {
  return textDisplayWidth(value) <= MAX_DUTY_ABBR_WIDTH;
}

/** 予定欄の最大幅（全角28文字＝半角56） */
export const MAX_SHIFT_PLAN_WIDTH = 56;

export function isValidShiftPlan(value: string): boolean {
  return textDisplayWidth(value) <= MAX_SHIFT_PLAN_WIDTH;
}

/** シフト種別マスタ */
export type ShiftTypeMaster = {
  id: string;
  name: string;
  abbreviation: string;
  startTime: string;
  endTime: string;
  breakTime: string;
  category: ShiftTypeCategory | "";
  /** 基本色名または #rrggbb。未設定は空文字 */
  iconColor: string;
};

export function createEmptyShiftType(): ShiftTypeMaster {
  return {
    id: crypto.randomUUID(),
    name: "",
    abbreviation: "",
    startTime: "",
    endTime: "",
    breakTime: "",
    category: "",
    iconColor: "",
  };
}

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

/** 新規シフト表作成ウィザードの入力途中データ */
export type NewShiftDraft = {
  /** 保存済みならサーバーの勤務表ID */
  serverId?: number;
  name: string;
  startDate: string;
  endDate: string;
  holidayCount: number;
  staff: ShiftStaffDraft[];
  dutyCounts: DutyCountDraft[];
  shiftCounts: ShiftCountDraft[];
  sheet: ShiftSheetDraft;
};
