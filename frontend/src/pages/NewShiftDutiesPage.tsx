import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { Navigate, useNavigate, useOutletContext } from "react-router-dom";
import { fetchDuties } from "../api/duties";
import { useAuth } from "../auth/AuthContext";
import { DutySelect } from "../components/DutySelect";
import { useShiftWizardPaths } from "../lib/shiftWizard";
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

/** 新規シフト作成：職務者のカウント設定 */
export function NewShiftDutiesPage() {
  const { draft, setDraft } = useOutletContext<NewShiftWizardContext>();
  const navigate = useNavigate();
  const paths = useShiftWizardPaths();
  const { token } = useAuth();
  const [rows, setRows] = useState<DutyCountDraft[]>(() =>
    initialRows(draft?.dutyCounts),
  );
  const [duties, setDuties] = useState<DutyMaster[]>([]);

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
  }

  function addRow() {
    setRows((current) => [...current, createDutyCountRow()]);
  }

  function removeRow(id: string) {
    setRows((current) => {
      const next = current.filter((row) => row.id !== id);
      return next.length === 0 ? [createDutyCountRow()] : next;
    });
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

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    persistDutyCounts(rows);
    navigate(paths.sheet);
  }

  return (
    <div className="shift-form-page shift-form-page--wide">
      <h2>職務者のカウント設定</h2>
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
                      duties={duties}
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
            className="btn-add-row btn-add-row--wide"
            onClick={addRow}
          >
            職務を追加
          </button>
        </div>

        <div className="shift-form__actions">
          <button type="submit" className="btn-primary">
            確定して次へ
          </button>
          <button type="button" className="btn-secondary" onClick={handleBack}>
            前にもどる
          </button>
        </div>
      </form>
    </div>
  );
}
