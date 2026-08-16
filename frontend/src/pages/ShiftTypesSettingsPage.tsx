import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { loadShiftTypes, saveShiftTypes } from "../lib/shiftTypeStore";
import { AppShell } from "../components/AppShell";
import {
  createEmptyShiftType,
  isValidShiftTypeAbbr,
  MAX_SHIFT_TYPES,
  SHIFT_TYPE_CATEGORIES,
  SHIFT_TYPE_COLOR_HEX,
  SHIFT_TYPE_COLORS,
  resolveShiftTypeColor,
  type ShiftTypeMaster,
} from "../types/shift";

const COLOR_PICKER_FALLBACK = "#c45c26";

function isBlankRow(row: ShiftTypeMaster): boolean {
  return (
    row.name.trim() === "" &&
    row.abbreviation.trim() === "" &&
    row.startTime === "" &&
    row.endTime === "" &&
    row.breakTime === "" &&
    row.category === "" &&
    row.iconColor === ""
  );
}

function toStoredTypes(rows: ShiftTypeMaster[]): ShiftTypeMaster[] {
  return rows
    .filter((row) => !isBlankRow(row))
    .map((row) => ({
      ...row,
      name: row.name.trim(),
      abbreviation: row.abbreviation.trim(),
      iconColor: resolveShiftTypeColor(row.iconColor) ?? "",
    }));
}

function initialRows(): ShiftTypeMaster[] {
  const saved = loadShiftTypes();
  if (saved.length > 0) {
    return saved.map((row) => ({ ...row }));
  }
  return [createEmptyShiftType()];
}

function IconColorField({
  row,
  index,
  onChange,
}: {
  row: ShiftTypeMaster;
  index: number;
  onChange: (value: string) => void;
}) {
  const resolved = resolveShiftTypeColor(row.iconColor);

  return (
    <div className="shift-type-color">
      {SHIFT_TYPE_COLORS.map((color) => {
        const hex = SHIFT_TYPE_COLOR_HEX[color];
        const selected = resolved === hex;
        return (
          <button
            key={color}
            type="button"
            className={
              selected
                ? "shift-type-color__swatch is-selected"
                : "shift-type-color__swatch"
            }
            style={{ backgroundColor: hex }}
            aria-label={`${index + 1}行目のアイコンの色 ${color}`}
            aria-pressed={selected}
            onClick={() => onChange(hex)}
          />
        );
      })}
      <input
        type="color"
        className="shift-type-color__picker"
        aria-label={`${index + 1}行目のアイコンの色を細かく選択`}
        value={resolved ?? COLOR_PICKER_FALLBACK}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

/** シフトの種類を登録する */
export function ShiftTypesSettingsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ShiftTypeMaster[]>(initialRows);
  const [error, setError] = useState<string | null>(null);

  const filledCount = rows.filter((row) => !isBlankRow(row)).length;

  function updateRow<K extends keyof ShiftTypeMaster>(
    id: string,
    field: K,
    value: ShiftTypeMaster[K],
  ) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  }

  function addRow() {
    if (rows.length >= MAX_SHIFT_TYPES) return;
    setRows((current) => [...current, createEmptyShiftType()]);
  }

  function removeRow(id: string) {
    setRows((current) => {
      const next = current.filter((row) => row.id !== id);
      return next.length === 0 ? [createEmptyShiftType()] : next;
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
      event.preventDefault();
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    for (const [index, row] of rows.entries()) {
      if (isBlankRow(row)) continue;
      if (!row.name.trim()) {
        setError(`${index + 1}行目のシフト名を入力してください`);
        return;
      }
      if (!isValidShiftTypeAbbr(row.abbreviation.trim())) {
        setError(
          `${index + 1}行目の表示は半角4文字または全角2文字以内にしてください`,
        );
        return;
      }
    }

    const stored = toStoredTypes(rows);

    if (stored.length > MAX_SHIFT_TYPES) {
      setError(`シフト種別は${MAX_SHIFT_TYPES}件まで登録できます`);
      return;
    }

    saveShiftTypes(stored);
    navigate("/settings");
  }

  return (
    <AppShell>
      <div className="shift-form-page shift-form-page--wide shift-form-page--types">
        <h2>シフトの種類を登録する</h2>
        <form
          className="shift-staff-form"
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          noValidate
        >
          <div className="shift-staff-table-wrap shift-staff-table-wrap--types">
            <table className="shift-staff-table shift-staff-table--types">
              <thead>
                <tr>
                  <th scope="col">シフト名</th>
                  <th scope="col">表示</th>
                  <th scope="col">出勤時間</th>
                  <th scope="col">退勤時間</th>
                  <th scope="col">休憩時間</th>
                  <th scope="col">類型</th>
                  <th scope="col">アイコンの色</th>
                  <th scope="col">
                    <span className="visually-hidden">削除</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id}>
                    <td>
                      <input
                        type="text"
                        maxLength={40}
                        aria-label={`${index + 1}行目のシフト名`}
                        value={row.name}
                        onChange={(event) =>
                          updateRow(row.id, "name", event.target.value)
                        }
                      />
                    </td>
                    <td className="shift-staff-table__abbr">
                      <input
                        type="text"
                        size={4}
                        aria-label={`${index + 1}行目の表示`}
                        value={row.abbreviation}
                        onChange={(event) =>
                          updateRow(row.id, "abbreviation", event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        aria-label={`${index + 1}行目の出勤時間`}
                        value={row.startTime}
                        onChange={(event) =>
                          updateRow(row.id, "startTime", event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        aria-label={`${index + 1}行目の退勤時間`}
                        value={row.endTime}
                        onChange={(event) =>
                          updateRow(row.id, "endTime", event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        aria-label={`${index + 1}行目の休憩時間`}
                        value={row.breakTime}
                        onChange={(event) =>
                          updateRow(row.id, "breakTime", event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <select
                        aria-label={`${index + 1}行目の類型`}
                        value={row.category}
                        onChange={(event) =>
                          updateRow(
                            row.id,
                            "category",
                            event.target.value as ShiftTypeMaster["category"],
                          )
                        }
                      >
                        <option value="">選択</option>
                        {SHIFT_TYPE_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <IconColorField
                        row={row}
                        index={index}
                        onChange={(value) =>
                          updateRow(row.id, "iconColor", value)
                        }
                      />
                    </td>
                    <td className="shift-staff-table__remove">
                      <button
                        type="button"
                        className="btn-text-danger"
                        onClick={() => removeRow(row.id)}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="shift-staff-toolbar">
            <button
              type="button"
              className="btn-secondary"
              onClick={addRow}
              disabled={rows.length >= MAX_SHIFT_TYPES}
            >
              行追加
            </button>
            <p className="shift-staff-count">
              登録数 {filledCount} / {MAX_SHIFT_TYPES}
            </p>
          </div>

          {error ? <p className="auth-error">{error}</p> : null}

          <div className="shift-form__actions">
            <button type="submit" className="btn-primary">
              保存してもどる
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/settings")}
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
