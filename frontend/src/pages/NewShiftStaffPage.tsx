import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { Navigate, useNavigate, useOutletContext } from "react-router-dom";
import { fetchDuties } from "../api/duties";
import { fetchStaffs } from "../api/staffs";
import { useAuth } from "../auth/AuthContext";
import { DutySelect } from "../components/DutySelect";
import { RowReorderButtons } from "../components/RowReorderButtons";
import { SuggestInput } from "../components/SuggestInput";
import { moveItem } from "../lib/moveItem";
import { useShiftWizardPaths } from "../lib/shiftWizard";
import {
  createEmptySheet,
  MAX_SHIFT_STAFF,
  type DutyMaster,
  type ShiftStaffDraft,
} from "../types/shift";
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

const DUTY_SLOTS = ["duty1", "duty2", "duty3"] as const;

type DutySlot = (typeof DUTY_SLOTS)[number];

/** 同じ行の他枠で選ばれている職務名 */
function otherDutyNames(row: ShiftStaffDraft, except: DutySlot): Set<string> {
  const names = new Set<string>();
  for (const slot of DUTY_SLOTS) {
    if (slot === except) continue;
    const name = row[slot].trim();
    if (name) names.add(name);
  }
  return names;
}

/** 同一職員内で職務が重複している枠の位置（0始まり）。なければ null */
function duplicateDutySlotIndex(row: ShiftStaffDraft): number | null {
  const seen = new Set<string>();
  for (const [index, slot] of DUTY_SLOTS.entries()) {
    const name = row[slot].trim();
    if (!name) continue;
    if (seen.has(name)) return index;
    seen.add(name);
  }
  return null;
}

/** 前後空白を除いた氏名が2行以上ある名前 */
function duplicateStaffNames(rows: ShiftStaffDraft[]): Set<string> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const name = row.name.trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const duplicates = new Set<string>();
  for (const [name, count] of counts) {
    if (count > 1) duplicates.add(name);
  }
  return duplicates;
}

function DuplicateNameWarn() {
  return (
    <span
      className="shift-staff-name__warn"
      data-tooltip="同一名の職員がいます"
      aria-label="同一名の職員がいます"
      tabIndex={0}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12.9 3.4c-.4-.7-1.4-.7-1.8 0L2.2 19.2c-.4.7.1 1.6.9 1.6h17.8c.8 0 1.3-.9.9-1.6L12.9 3.4ZM12 9.2c.5 0 .8.4.8.8l-.4 5.2h-.8L11.2 10c0-.4.3-.8.8-.8Zm0 9.1a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2Z"
        />
      </svg>
    </span>
  );
}

/** 新規シフト表作成：職員名はマスタ選択または手入力。職務はマスタから選択 */
export function NewShiftStaffPage() {
  const { draft, setDraft, unlockThrough, parkAndOpenSettings } =
    useOutletContext<NewShiftWizardContext>();
  const navigate = useNavigate();
  const paths = useShiftWizardPaths();
  const { token } = useAuth();
  const [rows, setRows] = useState<ShiftStaffDraft[]>(() =>
    initialRows(draft?.staff),
  );
  const [staffOptions, setStaffOptions] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [duties, setDuties] = useState<DutyMaster[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    void Promise.allSettled([fetchStaffs(token), fetchDuties(token)]).then(
      ([staffResult, dutyResult]) => {
        if (cancelled) return;
        if (staffResult.status === "fulfilled") {
          setStaffOptions(
            staffResult.value
              .filter((staff) => staff.name.trim() !== "")
              .map((staff) => ({ id: staff.id, label: staff.name })),
          );
        } else {
          setStaffOptions([]);
        }
        if (dutyResult.status === "fulfilled") {
          setDuties(
            dutyResult.value.filter((duty) => duty.name.trim() !== ""),
          );
        } else {
          setDuties([]);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!draft) {
    return <Navigate to={paths.root} replace />;
  }

  const currentDraft = draft;
  const filledCount = rows.filter((row) => !isBlankRow(row)).length;
  const duplicateNames = duplicateStaffNames(rows);
  const showNameWarnColumn = duplicateNames.size > 0;

  function persistStaff(nextRows: ShiftStaffDraft[]) {
    setDraft({
      ...currentDraft,
      staff: toStoredStaff(nextRows),
      shiftCounts: currentDraft.shiftCounts ?? [],
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
    setError(null);
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

  function moveRow(index: number, offset: -1 | 1) {
    setRows((current) => moveItem(current, index, offset));
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

  function handleGoToSettings() {
    parkAndOpenSettings(
      {
        ...currentDraft,
        staff: rows,
        shiftCounts: currentDraft.shiftCounts ?? [],
        sheet: currentDraft.sheet ?? createEmptySheet(),
      },
      paths.staff,
    );
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
      const duplicateSlot = duplicateDutySlotIndex(row);
      if (duplicateSlot != null) {
        setError(
          `${index + 1}行目の職務${duplicateSlot + 1}はすでにこの職員に設定されています`,
        );
        return;
      }
    }

    if (staff.length > MAX_SHIFT_STAFF) {
      setError(`職員は${MAX_SHIFT_STAFF}名まで登録できます`);
      return;
    }

    persistStaff(rows);
    unlockThrough("duties");
    navigate(paths.duties);
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
        <div className="shift-staff-table-wrap shift-staff-table-wrap--suggest">
          <table className="shift-staff-table">
            <thead>
              <tr>
                <th scope="col">職員氏名</th>
                <th scope="col">職務1</th>
                <th scope="col">職務2</th>
                <th scope="col">職務3</th>
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
                    <div className="shift-staff-name">
                      {showNameWarnColumn ? (
                        duplicateNames.has(row.name.trim()) ? (
                          <DuplicateNameWarn />
                        ) : (
                          <span
                            className="shift-staff-name__warn-spacer"
                            aria-hidden="true"
                          />
                        )
                      ) : null}
                      <SuggestInput
                        maxLength={40}
                        ariaLabel={`${index + 1}行目の職員氏名`}
                        value={row.name}
                        options={staffOptions}
                        emptyMessage="設定に職員が登録されていません"
                        noMatchMessage="一致する職員がいません"
                        onChange={(name) => updateRow(row.id, "name", name)}
                      />
                    </div>
                  </td>
                  <td>
                    <DutySelect
                      ariaLabel={`${index + 1}行目の職務1`}
                      value={row.duty1}
                      duties={duties.filter(
                        (duty) => !otherDutyNames(row, "duty1").has(duty.name),
                      )}
                      placeholder="未選択"
                      onChange={(value) => updateRow(row.id, "duty1", value)}
                    />
                  </td>
                  <td>
                    <DutySelect
                      ariaLabel={`${index + 1}行目の職務2`}
                      value={row.duty2}
                      duties={duties.filter(
                        (duty) => !otherDutyNames(row, "duty2").has(duty.name),
                      )}
                      placeholder="未選択"
                      onChange={(value) => updateRow(row.id, "duty2", value)}
                    />
                  </td>
                  <td>
                    <DutySelect
                      ariaLabel={`${index + 1}行目の職務3`}
                      value={row.duty3}
                      duties={duties.filter(
                        (duty) => !otherDutyNames(row, "duty3").has(duty.name),
                      )}
                      placeholder="未選択"
                      onChange={(value) => updateRow(row.id, "duty3", value)}
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
            disabled={rows.length >= MAX_SHIFT_STAFF}
          >
            行追加
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
