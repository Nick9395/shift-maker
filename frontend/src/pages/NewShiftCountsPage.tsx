import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { Navigate, useNavigate, useOutletContext } from "react-router-dom";
import { loadShiftTypesForUser } from "../api/shiftTypes";
import { useAuth } from "../auth/AuthContext";
import { RowReorderButtons } from "../components/RowReorderButtons";
import { ShiftTypeSelect } from "../components/ShiftTypeSelect";
import { useShiftWizardPaths } from "../lib/shiftWizard";
import { moveItem } from "../lib/moveItem";
import { workingShiftTypes } from "../lib/shiftCounts";
import { loadShiftTypes } from "../lib/shiftTypeStore";
import {
  createEmptySheet,
  MAX_SHIFT_COUNT_NAME,
  MAX_SHIFT_TYPES,
  type ShiftCountDraft,
  type ShiftTypeMaster,
} from "../types/shift";
import type { NewShiftWizardContext } from "./NewShiftLayout";

function createShiftCountRow(): ShiftCountDraft {
  return {
    id: crypto.randomUUID(),
    name: "",
    shiftTypeIds: [""],
    requiredCount: "",
    shortageNotice: true,
  };
}

function initialRows(shiftCounts: ShiftCountDraft[] | undefined): ShiftCountDraft[] {
  if (shiftCounts && shiftCounts.length > 0) {
    return shiftCounts.map((row) => ({
      ...row,
      shiftTypeIds:
        row.shiftTypeIds.length > 0 ? [...row.shiftTypeIds] : [""],
    }));
  }
  return [createShiftCountRow()];
}

function toBooleanSelect(value: boolean): "yes" | "no" {
  return value ? "yes" : "no";
}

function mergeShiftTypes(
  primary: ShiftTypeMaster[],
  extra: ShiftTypeMaster[],
): ShiftTypeMaster[] {
  const merged = [...primary];
  const ids = new Set(primary.map((type) => type.id));
  for (const type of extra) {
    if (ids.has(type.id)) continue;
    merged.push(type);
    ids.add(type.id);
  }
  return merged.slice(0, MAX_SHIFT_TYPES);
}

function takenTypeIds(
  rows: ShiftCountDraft[],
  exceptRowId?: string,
  exceptIndex?: number,
): Set<string> {
  const taken = new Set<string>();
  for (const row of rows) {
    row.shiftTypeIds.forEach((raw, index) => {
      if (row.id === exceptRowId && index === exceptIndex) return;
      const id = raw.trim();
      if (id) taken.add(id);
    });
  }
  return taken;
}

function duplicateTypeIndex(rows: ShiftCountDraft[]): [number, number] | null {
  const seen = new Set<string>();
  for (const [rowIndex, row] of rows.entries()) {
    for (const [typeIndex, raw] of row.shiftTypeIds.entries()) {
      const id = raw.trim();
      if (!id) continue;
      if (seen.has(id)) return [rowIndex, typeIndex];
      seen.add(id);
    }
  }
  return null;
}

function duplicateNameRowIndex(rows: ShiftCountDraft[]): number | null {
  const seen = new Set<string>();
  for (const [index, row] of rows.entries()) {
    const name = row.name.trim();
    if (!name) continue;
    if (seen.has(name)) return index;
    seen.add(name);
  }
  return null;
}

/** 新規シフト表作成：シフトカウント設定 */
export function NewShiftCountsPage() {
  const { draft, setDraft, paletteTypes, unlockThrough, parkAndOpenSettings } =
    useOutletContext<NewShiftWizardContext>();
  const navigate = useNavigate();
  const paths = useShiftWizardPaths();
  const { token } = useAuth();
  const [rows, setRows] = useState<ShiftCountDraft[]>(() =>
    initialRows(draft?.shiftCounts),
  );
  const [types, setTypes] = useState<ShiftTypeMaster[]>(() =>
    loadShiftTypes().slice(0, MAX_SHIFT_TYPES),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTypes() {
      let master: ShiftTypeMaster[] = loadShiftTypes().slice(0, MAX_SHIFT_TYPES);
      if (token) {
        try {
          master = await loadShiftTypesForUser(token);
        } catch {
          // DBを読めないときは端末に残っている種別で描画する
        }
      }
      if (cancelled) return;
      setTypes(mergeShiftTypes(master, paletteTypes ?? []));
    }

    void loadTypes();
    return () => {
      cancelled = true;
    };
  }, [paletteTypes, token]);

  if (!draft) {
    return <Navigate to={paths.root} replace />;
  }

  if (draft.staff.length === 0) {
    return <Navigate to={paths.staff} replace />;
  }

  const currentDraft = draft;
  const workingTypes = workingShiftTypes(types);
  const takenCount = takenTypeIds(rows).size;
  const canAddRow = takenCount < workingTypes.length;

  function persistShiftCounts(nextRows: ShiftCountDraft[]) {
    setDraft({
      ...currentDraft,
      shiftCounts: nextRows,
      sheet: currentDraft.sheet ?? createEmptySheet(),
    });
  }

  function updateRow<K extends keyof ShiftCountDraft>(
    id: string,
    field: K,
    value: ShiftCountDraft[K],
  ) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
    setError(null);
  }

  function updateTypeId(rowId: string, typeIndex: number, value: string) {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) return row;
        const nextIds = [...row.shiftTypeIds];
        nextIds[typeIndex] = value;
        return { ...row, shiftTypeIds: nextIds };
      }),
    );
    setError(null);
  }

  function addType(rowId: string) {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) return row;
        if (row.shiftTypeIds.some((id) => id.trim() === "")) return row;
        const remaining = workingTypes.length - takenTypeIds(current).size;
        if (remaining <= 0) return row;
        return { ...row, shiftTypeIds: [...row.shiftTypeIds, ""] };
      }),
    );
  }

  function removeType(rowId: string, typeIndex: number) {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) return row;
        if (row.shiftTypeIds.length <= 1) {
          return { ...row, shiftTypeIds: [""] };
        }
        return {
          ...row,
          shiftTypeIds: row.shiftTypeIds.filter((_, index) => index !== typeIndex),
        };
      }),
    );
    setError(null);
  }

  function addRow() {
    if (!canAddRow) return;
    setRows((current) => [...current, createShiftCountRow()]);
  }

  function removeRow(id: string) {
    setRows((current) => {
      const next = current.filter((row) => row.id !== id);
      return next.length === 0 ? [createShiftCountRow()] : next;
    });
  }

  function moveRow(index: number, offset: -1 | 1) {
    setRows((current) => moveItem(current, index, offset));
  }

  function canAddTypeToRow(row: ShiftCountDraft): boolean {
    if (workingTypes.length === 0) return false;
    if (row.shiftTypeIds.some((id) => id.trim() === "")) return false;
    return takenTypeIds(rows).size < workingTypes.length;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
      event.preventDefault();
    }
  }

  function handleBack() {
    persistShiftCounts(rows);
    navigate(paths.duties);
  }

  function handleGoToSettings() {
    parkAndOpenSettings(
      {
        ...currentDraft,
        shiftCounts: rows,
        sheet: currentDraft.sheet ?? createEmptySheet(),
      },
      paths.shiftCounts,
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const duplicateType = duplicateTypeIndex(rows);
    if (duplicateType != null) {
      const [rowIndex, typeIndex] = duplicateType;
      setError(
        `${rowIndex + 1}行目の${typeIndex + 1}つ目の種別はすでに設定されています`,
      );
      return;
    }
    const duplicateName = duplicateNameRowIndex(rows);
    if (duplicateName != null) {
      setError(`${duplicateName + 1}行目のシフトカウント名はすでに使われています`);
      return;
    }
    persistShiftCounts(rows);
    unlockThrough("sheet");
    navigate(paths.sheet);
  }

  return (
    <div className="shift-form-page shift-form-page--wide">
      <form
        className="shift-staff-form"
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        noValidate
      >
        {workingTypes.length === 0 ? (
          <p className="auth-muted">
            カウントできる勤務種別がありません。先に設定画面でシフト種別を作成してください。
          </p>
        ) : null}

        <div className="shift-staff-table-wrap">
          <table className="shift-staff-table shift-staff-table--shift-counts">
            <thead>
              <tr>
                <th scope="col">シフトカウント名</th>
                <th scope="col">カウントするシフト</th>
                <th scope="col">必要人数</th>
                <th scope="col">不足通知</th>
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
                  <td className="shift-count-table__name">
                    <input
                      type="text"
                      maxLength={MAX_SHIFT_COUNT_NAME}
                      aria-label={`${index + 1}行目のシフトカウント名`}
                      value={row.name}
                      onChange={(event) =>
                        updateRow(row.id, "name", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <div className="shift-count-types">
                      {row.shiftTypeIds.map((typeId, typeIndex) => {
                        const taken = takenTypeIds(rows, row.id, typeIndex);
                        return (
                          <div
                            key={`${row.id}-${typeIndex}`}
                            className="shift-count-types__row"
                          >
                            <ShiftTypeSelect
                              ariaLabel={`${index + 1}行目の${typeIndex + 1}つ目のカウントするシフト`}
                              value={typeId}
                              types={workingTypes.filter(
                                (type) => !taken.has(type.id),
                              )}
                              allTypes={types}
                              onChange={(value) =>
                                updateTypeId(row.id, typeIndex, value)
                              }
                            />
                            {row.shiftTypeIds.length > 1 ? (
                              <button
                                type="button"
                                className="btn-text-danger"
                                onClick={() => removeType(row.id, typeIndex)}
                              >
                                削除
                              </button>
                            ) : null}
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        className="btn-add-row shift-count-types__add"
                        onClick={() => addType(row.id)}
                        disabled={!canAddTypeToRow(row)}
                      >
                        ＋ シフト種別を追加
                      </button>
                    </div>
                  </td>
                  <td className="shift-duty-table__count">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      aria-label={`${index + 1}行目の必要人数`}
                      value={row.requiredCount}
                      onChange={(event) =>
                        updateRow(row.id, "requiredCount", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <select
                      aria-label={`${index + 1}行目の不足通知`}
                      value={toBooleanSelect(row.shortageNotice)}
                      onChange={(event) =>
                        updateRow(
                          row.id,
                          "shortageNotice",
                          event.target.value === "yes",
                        )
                      }
                    >
                      <option value="yes">する</option>
                      <option value="no">しない</option>
                    </select>
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
            disabled={!canAddRow}
          >
            ＋ 行追加
          </button>
        </div>

        {error ? <p className="auth-error">{error}</p> : null}

        <div className="shift-form__actions">
          <button type="submit" className="btn-primary">
            確定して次へ
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleGoToSettings}
          >
            設定画面へ
          </button>
          <button type="button" className="btn-secondary" onClick={handleBack}>
            前にもどる
          </button>
        </div>
      </form>
    </div>
  );
}
