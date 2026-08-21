import { useState } from "react";
import {
  defaultExcelOptions,
  type ShiftExcelOptions,
} from "../lib/shiftExcel";
import type { ShiftTypeMaster } from "../types/shift";

type ExcelExportDialogProps = {
  types: readonly ShiftTypeMaster[];
  exporting: boolean;
  onCancel: () => void;
  onDownload: (options: ShiftExcelOptions) => void;
};

/** Excel出力の項目選択 */
export function ExcelExportDialog({
  types,
  exporting,
  onCancel,
  onDownload,
}: ExcelExportDialogProps) {
  const selectableTypes = types.filter((type) => type.name.trim() !== "");
  const [options, setOptions] = useState<ShiftExcelOptions>(() =>
    defaultExcelOptions(selectableTypes),
  );

  function toggleFlag(key: keyof Omit<ShiftExcelOptions, "redShiftTypeIds">) {
    setOptions((current) => ({ ...current, [key]: !current[key] }));
  }

  function toggleRedType(typeId: string) {
    setOptions((current) => {
      const selected = new Set(current.redShiftTypeIds);
      if (selected.has(typeId)) selected.delete(typeId);
      else selected.add(typeId);
      return { ...current, redShiftTypeIds: [...selected] };
    });
  }

  return (
    <div
      className="confirm-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="excel-export-title"
    >
      <div className="confirm-dialog__backdrop" onClick={onCancel} />
      <div className="confirm-dialog__card confirm-dialog__card--wide">
        <p id="excel-export-title">
          このシフト表をExcel形式でダウンロードしますか？
        </p>
        <p className="excel-export-note">
          見出し（シフト名・期間・公休数）と氏名・日付・曜日・セルのシフトは必ず含まれます。
        </p>

        <fieldset className="excel-export-fieldset">
          <legend>任意の項目</legend>
          <label>
            <input
              type="checkbox"
              checked={options.includeDuty}
              onChange={() => toggleFlag("includeDuty")}
            />
            職務
          </label>
          <label>
            <input
              type="checkbox"
              checked={options.includeSummary}
              onChange={() => toggleFlag("includeSummary")}
            />
            サマリ
          </label>
          <label>
            <input
              type="checkbox"
              checked={options.includeDutyCounts}
              onChange={() => toggleFlag("includeDutyCounts")}
            />
            職務カウント
          </label>
          <label>
            <input
              type="checkbox"
              checked={options.includeShiftCounts}
              onChange={() => toggleFlag("includeShiftCounts")}
            />
            シフトカウント
          </label>
          <label>
            <input
              type="checkbox"
              checked={options.includePlans}
              onChange={() => toggleFlag("includePlans")}
            />
            予定
          </label>
          <label>
            <input
              type="checkbox"
              checked={options.includeCellFill}
              onChange={() => toggleFlag("includeCellFill")}
            />
            セルの背景色（オンのときは赤文字指定より優先）
          </label>
        </fieldset>

        <fieldset className="excel-export-fieldset">
          <legend>赤文字にするシフト種別</legend>
          {selectableTypes.length === 0 ? (
            <p className="excel-export-empty">この表に種別がありません。</p>
          ) : (
            <div className="excel-export-types">
              {selectableTypes.map((type) => (
                <label key={type.id}>
                  <input
                    type="checkbox"
                    checked={options.redShiftTypeIds.includes(type.id)}
                    onChange={() => toggleRedType(type.id)}
                    disabled={options.includeCellFill}
                  />
                  {type.name}
                </label>
              ))}
            </div>
          )}
        </fieldset>

        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="btn-primary confirm-dialog__btn"
            onClick={() => onDownload(options)}
            disabled={exporting}
          >
            {exporting ? "作成中..." : "ダウンロード"}
          </button>
          <button
            type="button"
            className="btn-secondary confirm-dialog__btn"
            onClick={onCancel}
            disabled={exporting}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
