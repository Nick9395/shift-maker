import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useOutletContext } from "react-router-dom";
import {
  eachIsoDate,
  formatJaDate,
  formatJaYearMonth,
  fromIsoDate,
  jaWeekday,
} from "../lib/date";
import {
  createEmptySheet,
  MAX_SHIFT_TYPES,
  SHIFT_TYPE_MASTER,
  sheetCellKey,
  type DutyCountDraft,
  type ShiftSheetDraft,
  type ShiftStaffDraft,
  type ShiftTypeMaster,
} from "../types/shift";
import type { NewShiftWizardContext } from "./NewShiftLayout";

const SUMMARY_COLUMNS = ["出勤", "公休", "年休", "時間休", "特休"] as const;

const visibleShiftTypes = SHIFT_TYPE_MASTER.slice(0, MAX_SHIFT_TYPES);

function formatStaffDuties(member: ShiftStaffDraft): string {
  const duties = [member.duty1, member.duty2, member.duty3].filter(Boolean);
  return duties.length > 0 ? duties.join("/") : "—";
}

function formatDutyCount(row: DutyCountDraft): string {
  const name = row.dutyId.trim() === "" ? "未選択" : row.dutyId;
  const count = row.requiredCount.trim() === "" ? "—" : row.requiredCount;
  return `${name}(${count})`;
}

function dateClassName(iso: string): string {
  const weekday = fromIsoDate(iso).getDay();
  if (weekday === 0) return "is-sun";
  if (weekday === 6) return "is-sat";
  return "";
}

function shiftTypeById(id: string): ShiftTypeMaster | undefined {
  return visibleShiftTypes.find((type) => type.id === id);
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M17 8h-1V6a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4Zm7 12H9v-8h8Z"
      />
    </svg>
  );
}

function mergeSheet(
  current: ShiftSheetDraft | undefined,
  patch: Partial<ShiftSheetDraft>,
): ShiftSheetDraft {
  return {
    ...createEmptySheet(),
    ...current,
    ...patch,
  };
}

/** シフト表作成画面 */
export function NewShiftSheetPage() {
  const { draft, setDraft } = useOutletContext<NewShiftWizardContext>();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const dates = useMemo(
    () => (draft ? eachIsoDate(draft.startDate, draft.endDate) : []),
    [draft],
  );

  useEffect(() => {
    if (!confirmCancel) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setConfirmCancel(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [confirmCancel]);

  if (!draft) {
    return <Navigate to="/shifts/new" replace />;
  }

  if (draft.staff.length === 0) {
    return <Navigate to="/shifts/new/staff" replace />;
  }

  const currentDraft = draft;
  const sheet = mergeSheet(currentDraft.sheet, {});
  const { plans, cells, lockedShiftTypeIds, allLocked } = sheet;
  const periodSameMonth =
    formatJaYearMonth(currentDraft.startDate) ===
    formatJaYearMonth(currentDraft.endDate);

  function updateSheet(patch: Partial<ShiftSheetDraft>) {
    setIsSaved(false);
    setDraft({
      ...currentDraft,
      sheet: mergeSheet(currentDraft.sheet, patch),
    });
  }

  function handleSave() {
    setIsSaved(true);
  }

  function handleCancel() {
    if (!isSaved) {
      setConfirmCancel(true);
      return;
    }
    navigate("/home");
  }

  function confirmDiscardAndLeave() {
    setConfirmCancel(false);
    navigate("/home");
  }

  function isTypeLocked(typeId: string): boolean {
    return allLocked || lockedShiftTypeIds.includes(typeId);
  }

  function isCellLocked(shiftTypeId: string | undefined): boolean {
    if (allLocked) return true;
    if (!shiftTypeId) return false;
    return lockedShiftTypeIds.includes(shiftTypeId);
  }

  function toggleTypeLock(typeId: string) {
    if (allLocked) return;
    const next = lockedShiftTypeIds.includes(typeId)
      ? lockedShiftTypeIds.filter((id) => id !== typeId)
      : [...lockedShiftTypeIds, typeId];
    updateSheet({ lockedShiftTypeIds: next });
  }

  function updatePlan(iso: string, value: string) {
    if (allLocked) return;
    updateSheet({
      plans: {
        ...plans,
        [iso]: value,
      },
    });
  }

  return (
    <div className="shift-sheet-page">
      <header className="shift-sheet-heading">
        <h2>{currentDraft.name}</h2>
        <p>
          {periodSameMonth
            ? formatJaYearMonth(currentDraft.startDate)
            : `${formatJaYearMonth(currentDraft.startDate)} 〜 ${formatJaYearMonth(currentDraft.endDate)}`}
          <span className="shift-sheet-heading__period">
            {formatJaDate(currentDraft.startDate)} 〜{" "}
            {formatJaDate(currentDraft.endDate)}
          </span>
          <span>公休数 {currentDraft.holidayCount}日</span>
        </p>
      </header>

      {visibleShiftTypes.length > 0 ? (
        <div className="shift-palette" aria-label="シフト種別">
          {visibleShiftTypes.map((type) => {
            const locked = isTypeLocked(type.id);
            return (
              <div
                key={type.id}
                className={
                  locked
                    ? "shift-palette__item is-locked"
                    : "shift-palette__item"
                }
              >
                <button type="button" className="shift-palette__btn">
                  <span className="shift-palette__name">{type.name}</span>
                  {type.abbreviation ? (
                    <span className="shift-palette__abbr">{type.abbreviation}</span>
                  ) : null}
                </button>
                <button
                  type="button"
                  className="shift-palette__lock"
                  aria-pressed={locked}
                  aria-label={`${type.name}を${locked ? "ロック解除" : "ロック"}`}
                  onClick={() => toggleTypeLock(type.id)}
                >
                  <LockIcon />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="shift-palette-empty">
          設定画面からシフト種別を登録してください。登録した種別のボタンが出現します。
        </p>
      )}

      <div className="shift-sheet-toolbar">
        <div className="shift-sheet-toolbar__lock">
          <button
            type="button"
            className={
              allLocked
                ? "btn-secondary btn-sheet-lock is-active"
                : "btn-secondary btn-sheet-lock"
            }
            aria-pressed={allLocked}
            onClick={() => updateSheet({ allLocked: true })}
          >
            全シフトロック
          </button>
          <button
            type="button"
            className="btn-secondary btn-sheet-lock"
            onClick={() =>
              updateSheet({ allLocked: false, lockedShiftTypeIds: [] })
            }
          >
            全シフトロック解除
          </button>
        </div>
        <div className="shift-sheet-toolbar__actions">
          <button
            type="button"
            className="btn-primary btn-sheet-action"
            onClick={handleSave}
          >
            保存
          </button>
          <button type="button" className="btn-secondary btn-sheet-action">
            自動作成
          </button>
          <button type="button" className="btn-secondary btn-sheet-action">
            PDF出力
          </button>
          <button type="button" className="btn-secondary btn-sheet-action">
            CSV出力
          </button>
          <button type="button" className="btn-secondary btn-sheet-action">
            設定画面へ
          </button>
          <button
            type="button"
            className="btn-secondary btn-sheet-action"
            onClick={() => navigate("/shifts/new/duties")}
          >
            前へもどる
          </button>
          <button
            type="button"
            className="btn-secondary btn-sheet-action"
            onClick={handleCancel}
          >
            キャンセル
          </button>
        </div>
      </div>

      <div className="shift-sheet-scroll">
        <div className="shift-sheet-scroll__inner">
        <table className="shift-sheet-table">
          <thead>
            <tr>
              <th className="col-name">氏名</th>
              <th className="col-duty">職務</th>
              {dates.map((iso, index) => {
                const date = fromIsoDate(iso);
                const showMonth = index === 0 || date.getDate() === 1;
                return (
                  <th
                    key={iso}
                    className={`col-date ${dateClassName(iso)}`}
                  >
                    {showMonth ? (
                      <span className="shift-sheet-month">{date.getMonth() + 1}月</span>
                    ) : null}
                    <span className="shift-sheet-day">{date.getDate()}</span>
                    <span className="shift-sheet-wday">{jaWeekday(iso)}</span>
                  </th>
                );
              })}
              {SUMMARY_COLUMNS.map((label, index) => (
                <th key={label} className={`col-sum col-sum-${index}`}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentDraft.staff.map((member) => (
              <tr key={member.id}>
                <th className="col-name" scope="row">
                  {member.name}
                </th>
                <td className="col-duty">{formatStaffDuties(member)}</td>
                {dates.map((iso) => {
                  const shiftTypeId = cells[sheetCellKey(member.id, iso)];
                  const shiftType = shiftTypeId
                    ? shiftTypeById(shiftTypeId)
                    : undefined;
                  const locked = isCellLocked(shiftTypeId);
                  return (
                    <td
                      key={iso}
                      className={`col-date ${dateClassName(iso)}${locked ? " is-locked" : ""}`}
                    >
                      <div className="shift-sheet-cell">
                        {shiftType ? (
                          <span className="shift-sheet-cell__value">
                            {shiftType.abbreviation || shiftType.name}
                          </span>
                        ) : null}
                      </div>
                    </td>
                  );
                })}
                {SUMMARY_COLUMNS.map((label, index) => (
                  <td key={label} className={`col-sum col-sum-${index}`}>
                    —
                  </td>
                ))}
              </tr>
            ))}
            <tr className="shift-sheet-count-row">
              <th className="col-name" scope="row">
                職務カウント
              </th>
              <td className="col-duty" />
              {dates.map((iso) => (
                <td key={iso} className={`col-date ${dateClassName(iso)}`}>
                  <ul className="shift-sheet-counts">
                    {currentDraft.dutyCounts.map((row) => (
                      <li key={row.id}>{formatDutyCount(row)}</li>
                    ))}
                  </ul>
                </td>
              ))}
              {SUMMARY_COLUMNS.map((label, index) => (
                <td key={label} className={`col-sum col-sum-${index}`} />
              ))}
            </tr>
            <tr className="shift-sheet-plan-row">
              <th className="col-name" scope="row">
                予定
              </th>
              <td className="col-duty" />
              {dates.map((iso) => (
                <td key={iso} className={`col-date ${dateClassName(iso)}`}>
                  <input
                    type="text"
                    maxLength={40}
                    aria-label={`${formatJaDate(iso)}の予定`}
                    value={plans[iso] ?? ""}
                    disabled={allLocked}
                    onChange={(event) => updatePlan(iso, event.target.value)}
                  />
                </td>
              ))}
              {SUMMARY_COLUMNS.map((label, index) => (
                <td key={label} className={`col-sum col-sum-${index}`} />
              ))}
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      {confirmCancel ? (
        <div
          className="confirm-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-confirm-title"
        >
          <div
            className="confirm-dialog__backdrop"
            onClick={() => setConfirmCancel(false)}
          />
          <div className="confirm-dialog__card">
            <p id="cancel-confirm-title">
              保存されていない編集内容は失われます。
              <br />
              よろしいですか？
            </p>
            <div className="confirm-dialog__actions">
              <button
                type="button"
                className="btn-primary confirm-dialog__btn"
                onClick={confirmDiscardAndLeave}
              >
                はい
              </button>
              <button
                type="button"
                className="btn-secondary confirm-dialog__btn"
                onClick={() => setConfirmCancel(false)}
              >
                いいえ
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
