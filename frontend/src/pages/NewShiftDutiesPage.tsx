import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { Navigate, useNavigate, useOutletContext } from "react-router-dom";
import { fetchDuties } from "../api/duties";
import { useAuth } from "../auth/AuthContext";
import { DutySelect } from "../components/DutySelect";
import { RowReorderButtons } from "../components/RowReorderButtons";
import { useShiftWizardPaths } from "../lib/shiftWizard";
import { moveItem } from "../lib/moveItem";
import {
  createEmptySheet,
  type DutyCountDraft,
  type DutyMaster,
} from "../types/shift";
import type { NewShiftWizardContext } from "./NewShiftLayout";

function createDutyCountRow(): DutyCountDraft {
  return {
    id: crypto.randomUUID(),
    dutyId: "",
    overlapCount: false,
    priority: false,
    requiredCount: "",
    shortageNotice: true,
  };
}

function initialRows(dutyCounts: DutyCountDraft[] | undefined): DutyCountDraft[] {
  if (dutyCounts && dutyCounts.length > 0) {
    return dutyCounts.map((row) => ({ ...row }));
  }
  return [createDutyCountRow()];
}

function toBooleanSelect(value: boolean): "yes" | "no" {
  return value ? "yes" : "no";
}

function selectedDutyNames(
  rows: DutyCountDraft[],
  exceptId?: string,
): Set<string> {
  const names = new Set<string>();
  for (const row of rows) {
    if (exceptId && row.id === exceptId) continue;
    const name = row.dutyId.trim();
    if (name) names.add(name);
  }
  return names;
}

function duplicateDutyRowIndex(rows: DutyCountDraft[]): number | null {
  const seen = new Set<string>();
  for (const [index, row] of rows.entries()) {
    const name = row.dutyId.trim();
    if (!name) continue;
    if (seen.has(name)) return index;
    seen.add(name);
  }
  return null;
}

/** 新規シフト表作成：職務カウント設定 */
export function NewShiftDutiesPage() {
  const { draft, setDraft, unlockThrough, parkAndOpenSettings } =
    useOutletContext<NewShiftWizardContext>();
  const navigate = useNavigate();
  const paths = useShiftWizardPaths();
  const { token } = useAuth();
  const [rows, setRows] = useState<DutyCountDraft[]>(() =>
    initialRows(draft?.dutyCounts),
  );
  const [duties, setDuties] = useState<DutyMaster[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    fetchDuties(token)
      .then((records) => {
        if (cancelled) return;
        setDuties(records.filter((duty) => duty.name.trim() !== ""));
      })
      .catch(() => {
        if (!cancelled) setDuties([]);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!draft) {
    return <Navigate to={paths.root} replace />;
  }

  if (draft.staff.length === 0) {
    return <Navigate to={paths.staff} replace />;
  }

  const currentDraft = draft;

  function persistDutyCounts(nextRows: DutyCountDraft[]) {
    setDraft({
      ...currentDraft,
      dutyCounts: nextRows,
      shiftCounts: currentDraft.shiftCounts ?? [],
      sheet: currentDraft.sheet ?? createEmptySheet(),
    });
  }

  function updateRow<K extends keyof DutyCountDraft>(
    id: string,
    field: K,
    value: DutyCountDraft[K],
  ) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
    setError(null);
  }

  const takenDutyCount = selectedDutyNames(rows).size;
  const canAddRow = takenDutyCount < duties.length;

  function addRow() {
    if (!canAddRow) return;
    setRows((current) => [...current, createDutyCountRow()]);
  }

  function removeRow(id: string) {
    setRows((current) => {
      const next = current.filter((row) => row.id !== id);
      return next.length === 0 ? [createDutyCountRow()] : next;
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

  function handleBack() {
    persistDutyCounts(rows);
    navigate(paths.staff);
  }

  function handleGoToSettings() {
    parkAndOpenSettings(
      {
        ...currentDraft,
        dutyCounts: rows,
        shiftCounts: currentDraft.shiftCounts ?? [],
        sheet: currentDraft.sheet ?? createEmptySheet(),
      },
      paths.duties,
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const duplicateIndex = duplicateDutyRowIndex(rows);
    if (duplicateIndex != null) {
      setError(
        `${duplicateIndex + 1}行目の職務はすでに設定されています`,
      );
      return;
    }
    persistDutyCounts(rows);
    unlockThrough("shiftCounts");
    navigate(paths.shiftCounts);
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
        <div className="shift-staff-table-wrap">
          <table className="shift-staff-table">
            <thead>
              <tr>
                <th scope="col">カウントする職務</th>
                <th scope="col">重複カウント</th>
                <th scope="col">優先</th>
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
                  <td>
                    <DutySelect
                      ariaLabel={`${index + 1}行目のカウントする職務`}
                      value={row.dutyId}
                      duties={duties.filter(
                        (duty) =>
                          !selectedDutyNames(rows, row.id).has(duty.name),
                      )}
                      onChange={(value) => updateRow(row.id, "dutyId", value)}
                    />
                  </td>
                  <td>
                    <select
                      aria-label={`${index + 1}行目の重複カウント`}
                      value={toBooleanSelect(row.overlapCount)}
                      onChange={(event) =>
                        updateRow(
                          row.id,
                          "overlapCount",
                          event.target.value === "yes",
                        )
                      }
                    >
                      <option value="yes">する</option>
                      <option value="no">しない</option>
                    </select>
                  </td>
                  <td>
                    <select
                      aria-label={`${index + 1}行目の優先`}
                      value={toBooleanSelect(row.priority)}
                      onChange={(event) =>
                        updateRow(
                          row.id,
                          "priority",
                          event.target.value === "yes",
                        )
                      }
                    >
                      <option value="no">なし</option>
                      <option value="yes">優先する</option>
                    </select>
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
            行追加
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
