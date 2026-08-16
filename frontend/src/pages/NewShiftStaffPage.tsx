import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Navigate, useNavigate, useOutletContext } from "react-router-dom";
import { useShiftWizardPaths } from "../lib/shiftWizard";
import { createEmptySheet, MAX_SHIFT_STAFF, type ShiftStaffDraft } from "../types/shift";
import type { NewShiftWizardContext } from "./NewShiftLayout";

function createStaffRow(): ShiftStaffDraft {
  return {
    id: crypto.randomUUID(),
    name: "",
    duty1: "",
    duty2: "",
    duty3: "",
  };
}

function isBlankRow(row: ShiftStaffDraft): boolean {
  return (
    row.name.trim() === "" &&
    row.duty1.trim() === "" &&
    row.duty2.trim() === "" &&
    row.duty3.trim() === ""
  );
}

function toStoredStaff(rows: ShiftStaffDraft[]): ShiftStaffDraft[] {
  return rows
    .filter((row) => !isBlankRow(row))
    .map((row) => ({
      ...row,
      name: row.name.trim(),
      duty1: row.duty1.trim(),
      duty2: row.duty2.trim(),
      duty3: row.duty3.trim(),
    }));
}

function initialRows(staff: ShiftStaffDraft[] | undefined): ShiftStaffDraft[] {
  if (staff && staff.length > 0) {
    return staff.map((row) => ({ ...row }));
  }
  return [createStaffRow()];
}

/** 新規シフト作成：職員名と職務の手入力 */
export function NewShiftStaffPage() {
  const { draft, setDraft } = useOutletContext<NewShiftWizardContext>();
  const navigate = useNavigate();
  const paths = useShiftWizardPaths();
  const [rows, setRows] = useState<ShiftStaffDraft[]>(() =>
    initialRows(draft?.staff),
  );
  const [error, setError] = useState<string | null>(null);

  if (!draft) {
    return <Navigate to={paths.root} replace />;
  }

  const currentDraft = draft;
  const filledCount = rows.filter((row) => !isBlankRow(row)).length;

  function persistStaff(nextRows: ShiftStaffDraft[]) {
    setDraft({
      ...currentDraft,
      staff: toStoredStaff(nextRows),
      sheet: currentDraft.sheet ?? createEmptySheet(),
    });
  }

  function updateRow(
    id: string,
    field: keyof Omit<ShiftStaffDraft, "id">,
    value: string,
  ) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  }

  function addRow() {
    if (rows.length >= MAX_SHIFT_STAFF) return;
    setRows((current) => [...current, createStaffRow()]);
  }

  function removeRow(id: string) {
    setRows((current) => {
      const next = current.filter((row) => row.id !== id);
      return next.length === 0 ? [createStaffRow()] : next;
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
      event.preventDefault();
    }
  }

  function handleBack() {
    persistStaff(rows);
    navigate(paths.root);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const staff = toStoredStaff(rows);
    if (staff.length === 0) {
      setError("職員を1名以上入力してください");
      return;
    }

    for (const [index, row] of staff.entries()) {
      if (!row.name) {
        setError(`${index + 1}行目の職員氏名を入力してください`);
        return;
      }
      if (!row.duty1) {
        setError(`${index + 1}行目の職務1を入力してください`);
        return;
      }
    }

    if (staff.length > MAX_SHIFT_STAFF) {
      setError(`職員は${MAX_SHIFT_STAFF}名まで登録できます`);
      return;
    }

    persistStaff(rows);
    navigate(paths.duties);
  }

  return (
    <div className="shift-form-page shift-form-page--wide">
      <h2>職員の登録</h2>
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
                <th scope="col">職員氏名</th>
                <th scope="col">職務1</th>
                <th scope="col">職務2</th>
                <th scope="col">職務3</th>
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
                      aria-label={`${index + 1}行目の職員氏名`}
                      value={row.name}
                      onChange={(event) =>
                        updateRow(row.id, "name", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      maxLength={40}
                      aria-label={`${index + 1}行目の職務1`}
                      value={row.duty1}
                      onChange={(event) =>
                        updateRow(row.id, "duty1", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      maxLength={40}
                      aria-label={`${index + 1}行目の職務2`}
                      value={row.duty2}
                      onChange={(event) =>
                        updateRow(row.id, "duty2", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      maxLength={40}
                      aria-label={`${index + 1}行目の職務3`}
                      value={row.duty3}
                      onChange={(event) =>
                        updateRow(row.id, "duty3", event.target.value)
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
            disabled={rows.length >= MAX_SHIFT_STAFF}
          >
            職員を追加
          </button>
          <p className="shift-staff-count">
            職員登録数 {filledCount} / {MAX_SHIFT_STAFF}
          </p>
        </div>

        {error ? <p className="auth-error">{error}</p> : null}

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
