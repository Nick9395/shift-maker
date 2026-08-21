import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { loadShiftTypesForUser, replaceShiftTypes } from "../api/shiftTypes";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AppShell } from "../components/AppShell";
import { FlashToast, useFlash } from "../components/FlashToast";
import { RowReorderButtons } from "../components/RowReorderButtons";
import { moveItem } from "../lib/moveItem";
import { useSettingsReturnTo } from "../lib/settingsReturnTo";
import {
  createEmptyShiftType,
  isValidShiftTypeAbbr,
  MAX_SHIFT_TYPES,
  SHIFT_TYPE_CATEGORIES,
  SHIFT_TYPE_COLOR_HEX,
  SHIFT_TYPE_COLORS,
  isPresetShiftTypeColor,
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

function initialRows(types: ShiftTypeMaster[]): ShiftTypeMaster[] {
  if (types.length > 0) {
    return types.map((row) => ({ ...row }));
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
  const customSelected = Boolean(resolved) && !isPresetShiftTypeColor(row.iconColor);
  const rootRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const pickingCustomRef = useRef(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const picker = pickerRef.current;
    if (!picker) return;

    function handleNativeChange() {
      pickingCustomRef.current = false;
      setOpen(false);
    }

    picker.addEventListener("change", handleNativeChange);
    return () => {
      picker.removeEventListener("change", handleNativeChange);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const picker = pickerRef.current;

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      if (pickingCustomRef.current) return;
      if (picker && document.activeElement === picker) return;
      setOpen(false);
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape" && !pickingCustomRef.current) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function selectPreset(hex: string) {
    pickingCustomRef.current = false;
    onChange(hex);
    setOpen(false);
  }

  return (
    <div className="shift-type-color" ref={rootRef}>
      <button
        type="button"
        className={
          resolved
            ? "shift-type-color__current"
            : "shift-type-color__current is-empty"
        }
        style={resolved ? { backgroundColor: resolved } : undefined}
        aria-label={
          resolved
            ? `${index + 1}行目のアイコンの色 選択中`
            : `${index + 1}行目のアイコンの色 未選択`
        }
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((current) => !current)}
      />
      <div
        className={
          open
            ? "shift-type-color__popover"
            : "shift-type-color__popover is-closed"
        }
        role="listbox"
        aria-hidden={!open}
        aria-label={`${index + 1}行目のアイコンの色`}
      >
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
                aria-selected={selected}
                role="option"
                onClick={() => selectPreset(hex)}
              />
            );
          })}
          <label
            className={
              customSelected
                ? "shift-type-color__picker-wrap"
                : "shift-type-color__picker-wrap is-empty"
            }
          >
            <input
              ref={pickerRef}
              type="color"
              className="shift-type-color__picker"
              aria-label={`${index + 1}行目のアイコンの色を細かく選択`}
              value={customSelected && resolved ? resolved : COLOR_PICKER_FALLBACK}
              onPointerDown={() => {
                pickingCustomRef.current = true;
              }}
              onChange={(event) => onChange(event.target.value)}
            />
          </label>
        </div>
    </div>
  );
}

/** シフト種別を登録する */
export function ShiftTypesSettingsPage() {
  const navigate = useNavigate();
  const returnTo = useSettingsReturnTo();
  const { token } = useAuth();
  const [rows, setRows] = useState<ShiftTypeMaster[]>(() => [
    createEmptyShiftType(),
  ]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { flashMessage, showFlash } = useFlash();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    loadShiftTypesForUser(token)
      .then((types) => {
        if (!cancelled) setRows(initialRows(types));
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(
          caught instanceof ApiError
            ? caught.message
            : "シフト種別を読み込めませんでした",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

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

  function moveRow(index: number, offset: -1 | 1) {
    setRows((current) => moveItem(current, index, offset));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
      event.preventDefault();
    }
  }

  async function handleSubmit(event: FormEvent) {
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
    if (!token) {
      setError("ログインが必要です");
      return;
    }

    setSaving(true);
    try {
      await replaceShiftTypes(token, stored);
      showFlash("保存しました");
    } catch (caught: unknown) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "シフト種別の保存に失敗しました",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <FlashToast message={flashMessage} />
      <div className="shift-form-page shift-form-page--wide shift-form-page--types">
        {loading ? <p className="auth-muted">読み込み中...</p> : null}
        {loading ? null : (
        <form
          className="shift-staff-form"
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
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
                    <span className="visually-hidden">並び替え</span>
                  </th>
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
                    <td className="shift-staff-table__reorder">
                      <RowReorderButtons
                        index={index}
                        total={rows.length}
                        onMove={(offset) => moveRow(index, offset)}
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
              className="btn-add-row btn-add-row--settings"
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

          <div className="shift-form__actions shift-form__actions--equal">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(returnTo ?? "/settings")}
              disabled={saving}
            >
              {returnTo ? "編集画面にもどる" : "もどる"}
            </button>
          </div>
        </form>
        )}
      </div>
    </AppShell>
  );
}
