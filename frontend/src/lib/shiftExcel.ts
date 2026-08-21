import type ExcelJS from "exceljs";
import { eachIsoDate, formatJaDate, fromIsoDate, jaWeekday } from "./date";
import { countDutiesForDate, isDutyCountShort } from "./dutyCounts";
import {
  activeShiftCounts,
  countShiftTypesForDate,
  isShiftCountShort,
  selectedShiftTypeIds,
} from "./shiftCounts";
import {
  countStaffSummary,
  SUMMARY_COLUMNS,
} from "./shiftSummary";
import {
  resolveShiftTypeColor,
  sheetCellKey,
  type DutyCountDraft,
  type DutyMaster,
  type NewShiftDraft,
  type ShiftCountDraft,
  type ShiftTypeCategory,
  type ShiftTypeMaster,
} from "../types/shift";

const COLOR_SUN = "FFB42318";
const COLOR_SAT = "FF1D4E89";
const COLOR_INK = "FF1F1F1F";
const COLOR_SHORT = "FFB42318";
const COLOR_BORDER = "FFBBBBBB";
const COLOR_HEADER_BG = "FFFFFAF3";

/** 初期オンにする赤文字種別 */
export const RED_TEXT_CATEGORIES: ReadonlySet<ShiftTypeCategory> = new Set([
  "公休",
  "特休",
  "年休",
]);

export type ShiftExcelOptions = {
  includeDuty: boolean;
  includeSummary: boolean;
  includeDutyCounts: boolean;
  includeShiftCounts: boolean;
  includePlans: boolean;
  includeCellFill: boolean;
  redShiftTypeIds: string[];
};

export function defaultExcelOptions(
  types: readonly ShiftTypeMaster[],
): ShiftExcelOptions {
  return {
    includeDuty: true,
    includeSummary: true,
    includeDutyCounts: true,
    includeShiftCounts: true,
    includePlans: true,
    includeCellFill: false,
    redShiftTypeIds: defaultRedShiftTypeIds(types),
  };
}

export function defaultRedShiftTypeIds(
  types: readonly ShiftTypeMaster[],
): string[] {
  return types
    .filter(
      (type) =>
        type.name.trim() !== "" &&
        RED_TEXT_CATEGORIES.has(type.category as ShiftTypeCategory),
    )
    .map((type) => type.id);
}

/** シフト名_2026_08_01.xlsx */
export function shiftExcelFileName(name: string, startDate: string): string {
  const safeName =
    name.replace(/[\\/:*?"<>|]/g, "_").trim() || "シフト表";
  const datePart = startDate.replace(/-/g, "_");
  return `${safeName}_${datePart}.xlsx`;
}

type BuildParams = {
  draft: NewShiftDraft;
  types: ShiftTypeMaster[];
  duties: DutyMaster[];
  options: ShiftExcelOptions;
};

const thin = {
  style: "thin" as const,
  color: { argb: COLOR_BORDER },
};

const thinBorder: Partial<ExcelJS.Borders> = {
  top: thin,
  left: thin,
  bottom: thin,
  right: thin,
};

function toArgb(hex: string): string {
  const value = hex.replace("#", "").toUpperCase();
  if (value.length === 6) return `FF${value}`;
  return COLOR_INK;
}

function contrastInkArgb(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const linear = (channel: number) => {
    const value = channel / 255;
    return value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance =
    0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  return luminance > 0.45 ? COLOR_INK : "FFFFFFFF";
}

function weekdayFontArgb(iso: string): string | undefined {
  const weekday = fromIsoDate(iso).getDay();
  if (weekday === 0) return COLOR_SUN;
  if (weekday === 6) return COLOR_SAT;
  return undefined;
}

function dateHeaderLabel(iso: string, index: number): string {
  const date = fromIsoDate(iso);
  if (index === 0 || date.getDate() === 1) {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
  return String(date.getDate());
}

function dutyCountLabel(row: DutyCountDraft): string {
  return row.dutyId.trim();
}

function shiftCountLabel(
  row: ShiftCountDraft,
  types: ShiftTypeMaster[],
): string {
  const name = row.name.trim();
  if (name) return name;
  const firstId = selectedShiftTypeIds(row)[0];
  const firstType = firstId
    ? types.find((type) => type.id === firstId)
    : undefined;
  return firstType?.name.trim() || firstType?.abbreviation.trim() || "";
}

function formatStaffDuties(
  member: NewShiftDraft["staff"][number],
  dutyByName: Map<string, string>,
): string {
  const labels = [member.duty1, member.duty2, member.duty3]
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => dutyByName.get(name) || name);
  return labels.join("/");
}

function styleHeader(cell: ExcelJS.Cell, fontArgb?: string) {
  cell.font = {
    bold: true,
    size: 10,
    color: { argb: fontArgb ?? COLOR_INK },
  };
  cell.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLOR_HEADER_BG },
  };
  cell.border = thinBorder;
}

function styleBody(cell: ExcelJS.Cell) {
  cell.font = { size: 10, color: { argb: COLOR_INK } };
  cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  cell.border = thinBorder;
}

/** A4横・横幅1ページ。データがある範囲だけを印刷する */
function applySheetPrintSetup(
  sheet: ExcelJS.Worksheet,
  lastRow: number,
  lastCol: number,
) {
  const endRow = Math.max(1, lastRow);
  const endCol = Math.max(1, lastCol);
  const lastAddress = sheet.getCell(endRow, endCol).address;
  sheet.pageSetup = {
    paperSize: 9,
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printArea: `A1:${lastAddress}`,
    horizontalCentered: true,
  };
}

/** 画面の現在内容からxlsxを生成して保存ダイアログ相当のダウンロードを行う */
export async function downloadShiftExcel(params: BuildParams): Promise<void> {
  const { draft, types, duties, options } = params;
  const dates = eachIsoDate(draft.startDate, draft.endDate);
  const typeById = new Map(types.map((type) => [type.id, type]));
  const redIds = new Set(options.redShiftTypeIds);
  const dutyByName = new Map<string, string>();
  for (const duty of duties) {
    const abbreviation = duty.abbreviation.trim();
    if (abbreviation) dutyByName.set(duty.name, abbreviation);
  }

  const showDutyCol =
    options.includeDuty ||
    options.includeDutyCounts ||
    options.includeShiftCounts;
  const dutyRows = options.includeDutyCounts
    ? draft.dutyCounts.filter((row) => row.dutyId.trim() !== "")
    : [];
  const shiftRows = options.includeShiftCounts
    ? activeShiftCounts(draft.shiftCounts ?? [])
    : [];

  const Workbook = await loadWorkbookCtor();
  const workbook = new Workbook();
  workbook.creator = "Shift Maker";
  const sheet = workbook.addWorksheet("シフト表", {
    views: [{ showGridLines: false }],
  });

  sheet.getRow(1).height = 18;
  sheet.getRow(2).height = 18;

  const titleRow = sheet.getRow(3);
  titleRow.height = 20;
  titleRow.getCell(1).value = draft.name;
  titleRow.getCell(1).font = { size: 12, bold: true, color: { argb: COLOR_INK } };

  const metaRow = sheet.getRow(4);
  metaRow.height = 20;
  metaRow.getCell(1).value =
    `${formatJaDate(draft.startDate)}〜${formatJaDate(draft.endDate)}`;
  metaRow.getCell(5).value = `公休数 ${draft.holidayCount}日`;
  metaRow.getCell(1).font = { size: 12, bold: true, color: { argb: COLOR_INK } };
  metaRow.getCell(5).font = { size: 12, bold: true, color: { argb: COLOR_INK } };

  const headerDateRow = 5;
  const headerWdayRow = 6;
  const nameCol = 1;
  const dutyCol = showDutyCol ? 2 : null;
  const firstDateCol = showDutyCol ? 3 : 2;
  const lastDateCol = firstDateCol + dates.length - 1;
  const firstSumCol = options.includeSummary ? lastDateCol + 1 : null;

  const dateRow = sheet.getRow(headerDateRow);
  const wdayRow = sheet.getRow(headerWdayRow);
  dateRow.height = 18;
  wdayRow.height = 18;

  const nameDate = dateRow.getCell(nameCol);
  nameDate.value = "氏名";
  styleHeader(nameDate);
  const nameWday = wdayRow.getCell(nameCol);
  styleHeader(nameWday);
  sheet.mergeCells(headerDateRow, nameCol, headerWdayRow, nameCol);

  if (dutyCol != null) {
    const dutyDate = dateRow.getCell(dutyCol);
    dutyDate.value = "職務";
    styleHeader(dutyDate);
    const dutyWday = wdayRow.getCell(dutyCol);
    styleHeader(dutyWday);
    sheet.mergeCells(headerDateRow, dutyCol, headerWdayRow, dutyCol);
  }

  dates.forEach((iso, index) => {
    const col = firstDateCol + index;
    const fontArgb = weekdayFontArgb(iso);
    const dayCell = dateRow.getCell(col);
    dayCell.value = dateHeaderLabel(iso, index);
    styleHeader(dayCell, fontArgb);
    const wdayCell = wdayRow.getCell(col);
    wdayCell.value = jaWeekday(iso);
    styleHeader(wdayCell, fontArgb);
  });

  if (firstSumCol != null) {
    SUMMARY_COLUMNS.forEach((label, index) => {
      const col = firstSumCol + index;
      const top = dateRow.getCell(col);
      top.value = label;
      styleHeader(top);
      styleHeader(wdayRow.getCell(col));
      sheet.mergeCells(headerDateRow, col, headerWdayRow, col);
    });
  }

  let dataRow = headerWdayRow + 1;

  const dutyTotalsByDate = new Map<string, Map<string, number>>();
  if (dutyRows.length > 0) {
    for (const iso of dates) {
      dutyTotalsByDate.set(
        iso,
        countDutiesForDate({
          staff: draft.staff,
          dutyCounts: draft.dutyCounts,
          cells: draft.sheet.cells,
          types,
          isoDate: iso,
        }),
      );
    }
  }

  const shiftTotalsByDate = new Map<string, Map<string, number>>();
  if (shiftRows.length > 0) {
    for (const iso of dates) {
      shiftTotalsByDate.set(
        iso,
        countShiftTypesForDate({
          staff: draft.staff,
          shiftCounts: draft.shiftCounts ?? [],
          cells: draft.sheet.cells,
          isoDate: iso,
        }),
      );
    }
  }

  for (const member of draft.staff) {
    const row = sheet.getRow(dataRow);
    row.height = 18;
    const nameCell = row.getCell(nameCol);
    nameCell.value = member.name;
    styleBody(nameCell);
    nameCell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };

    if (dutyCol != null) {
      const dutyCell = row.getCell(dutyCol);
      dutyCell.value = options.includeDuty
        ? formatStaffDuties(member, dutyByName)
        : "";
      styleBody(dutyCell);
    }

    dates.forEach((iso, index) => {
      const col = firstDateCol + index;
      const cell = row.getCell(col);
      styleBody(cell);
      const typeId = draft.sheet.cells[sheetCellKey(member.id, iso)];
      const shiftType = typeId ? typeById.get(typeId) : undefined;
      if (!shiftType) return;
      const abbreviation = shiftType.abbreviation.trim();
      if (!abbreviation) return;
      cell.value = abbreviation;
      const fillHex = options.includeCellFill
        ? resolveShiftTypeColor(shiftType.iconColor)
        : undefined;
      if (fillHex) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: toArgb(fillHex) },
        };
        cell.font = {
          size: 10,
          color: { argb: contrastInkArgb(fillHex) },
          bold: true,
        };
      } else if (redIds.has(shiftType.id)) {
        cell.font = { size: 10, color: { argb: COLOR_SHORT }, bold: true };
      }
    });

    if (firstSumCol != null) {
      const totals = countStaffSummary(
        member,
        dates,
        draft.sheet.cells,
        types,
      );
      SUMMARY_COLUMNS.forEach((label, index) => {
        const col = firstSumCol + index;
        const cell = row.getCell(col);
        cell.value = totals[label];
        styleBody(cell);
        const mismatch =
          label === "公休" && totals[label] !== draft.holidayCount;
        if (mismatch) {
          cell.font = { size: 10, color: { argb: COLOR_SHORT }, bold: true };
        }
      });
    }
    dataRow += 1;
  }

  for (const countRow of dutyRows) {
    writeCountRow({
      sheet,
      rowIndex: dataRow,
      nameCol,
      dutyCol,
      firstDateCol,
      firstSumCol,
      dates,
      label: dutyCountLabel(countRow),
      values: dates.map(
        (iso) => dutyTotalsByDate.get(iso)?.get(countRow.id) ?? 0,
      ),
      shorts: dates.map((iso) =>
        isDutyCountShort(
          countRow,
          dutyTotalsByDate.get(iso)?.get(countRow.id) ?? 0,
        ),
      ),
    });
    dataRow += 1;
  }

  for (const countRow of shiftRows) {
    writeCountRow({
      sheet,
      rowIndex: dataRow,
      nameCol,
      dutyCol,
      firstDateCol,
      firstSumCol,
      dates,
      label: shiftCountLabel(countRow, types),
      values: dates.map(
        (iso) => shiftTotalsByDate.get(iso)?.get(countRow.id) ?? 0,
      ),
      shorts: dates.map((iso) =>
        isShiftCountShort(
          countRow,
          shiftTotalsByDate.get(iso)?.get(countRow.id) ?? 0,
        ),
      ),
    });
    dataRow += 1;
  }

  if (options.includePlans) {
    const row = sheet.getRow(dataRow);
    row.height = 40;
    const nameCell = row.getCell(nameCol);
    nameCell.value = "予定";
    styleBody(nameCell);
    nameCell.alignment = { vertical: "middle", horizontal: "left" };
    if (dutyCol != null) {
      styleBody(row.getCell(dutyCol));
    }
    dates.forEach((iso, index) => {
      const cell = row.getCell(firstDateCol + index);
      const body = (draft.sheet.plans[iso] ?? "").trim();
      cell.value = body;
      styleBody(cell);
      cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    });
    if (firstSumCol != null) {
      SUMMARY_COLUMNS.forEach((_, index) => {
        styleBody(row.getCell(firstSumCol + index));
      });
    }
  }

  const lastRow = options.includePlans ? dataRow : dataRow - 1;
  const lastCol = Math.max(
    5,
    firstSumCol != null
      ? firstSumCol + SUMMARY_COLUMNS.length - 1
      : dates.length > 0
        ? lastDateCol
        : (dutyCol ?? nameCol),
  );

  sheet.getColumn(nameCol).width = 14;
  if (dutyCol != null) sheet.getColumn(dutyCol).width = 12;
  for (let index = 0; index < dates.length; index += 1) {
    sheet.getColumn(firstDateCol + index).width = 6;
  }
  if (firstSumCol != null) {
    SUMMARY_COLUMNS.forEach((_, index) => {
      sheet.getColumn(firstSumCol + index).width = 8;
    });
  }

  const freezeCols = showDutyCol ? 2 : 1;
  const freezeRows = headerWdayRow;
  sheet.views = [
    {
      state: "frozen",
      xSplit: freezeCols,
      ySplit: freezeRows,
      showGridLines: false,
    },
  ];

  applySheetPrintSetup(sheet, lastRow, lastCol);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = excelBufferToBlob(buffer);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = shiftExcelFileName(draft.name, draft.startDate);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function excelBufferToBlob(buffer: unknown): Blob {
  let bytes: Uint8Array;
  if (buffer instanceof Uint8Array) {
    bytes = buffer;
  } else if (buffer instanceof ArrayBuffer) {
    bytes = new Uint8Array(buffer);
  } else if (ArrayBuffer.isView(buffer)) {
    bytes = new Uint8Array(
      buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      ),
    );
  } else {
    bytes = new Uint8Array(buffer as ArrayBuffer);
  }
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy.buffer as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

async function loadWorkbookCtor(): Promise<new () => ExcelJS.Workbook> {
  const mod = await import("exceljs");
  const candidate = (mod as { default?: unknown }).default ?? mod;
  const ctor = workbookCtorFrom(candidate) ?? workbookCtorFrom(
    candidate && typeof candidate === "object"
      ? (candidate as { default?: unknown }).default
      : undefined,
  );
  if (!ctor) {
    throw new Error("ExcelJS を読み込めませんでした");
  }
  return ctor;
}

function workbookCtorFrom(
  value: unknown,
): (new () => ExcelJS.Workbook) | undefined {
  if (value == null) return undefined;
  if (
    typeof value === "object" &&
    "Workbook" in value &&
    typeof (value as { Workbook: unknown }).Workbook === "function"
  ) {
    return (value as { Workbook: new () => ExcelJS.Workbook }).Workbook;
  }
  if (typeof value === "function") {
    return value as new () => ExcelJS.Workbook;
  }
  return undefined;
}

function writeCountRow(params: {
  sheet: ExcelJS.Worksheet;
  rowIndex: number;
  nameCol: number;
  dutyCol: number | null;
  firstDateCol: number;
  firstSumCol: number | null;
  dates: string[];
  label: string;
  values: number[];
  shorts: boolean[];
}) {
  const row = params.sheet.getRow(params.rowIndex);
  row.height = 18;
  const nameCell = row.getCell(params.nameCol);
  nameCell.value = "";
  styleBody(nameCell);

  if (params.dutyCol != null) {
    const dutyCell = row.getCell(params.dutyCol);
    dutyCell.value = params.label;
    styleBody(dutyCell);
    dutyCell.alignment = { vertical: "middle", horizontal: "left" };
  }

  params.dates.forEach((_, index) => {
    const cell = row.getCell(params.firstDateCol + index);
    cell.value = params.values[index] ?? 0;
    styleBody(cell);
    if (params.shorts[index]) {
      cell.font = { size: 10, color: { argb: COLOR_SHORT }, bold: true };
    }
  });

  if (params.firstSumCol != null) {
    SUMMARY_COLUMNS.forEach((_, index) => {
      styleBody(row.getCell(params.firstSumCol! + index));
    });
  }
}
