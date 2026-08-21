import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { fetchDuties } from "../api/duties";
import { ApiError } from "../api/client";
import { fetchStaffs } from "../api/staffs";
import {
  draftFromShiftDetail,
  fetchShift,
  fetchShifts,
  type ShiftSummary,
} from "../api/shifts";
import { loadShiftTypesForUser } from "../api/shiftTypes";
import { useAuth } from "../auth/AuthContext";
import { DatePicker } from "../components/DatePicker";
import { copySettingsFromHistory } from "../lib/copyShiftHistory";
import { formatJaDate, inclusiveDayCount } from "../lib/date";
import { useShiftWizardPaths } from "../lib/shiftWizard";
import { clearWizardPark } from "../lib/wizardPark";
import { createEmptySheet } from "../types/shift";
import type { NewShiftWizardContext } from "./NewShiftLayout";

function parseHolidayCount(raw: string): number | null {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) return null;
  return value;
}

type SetupValues = {
  name: string;
  startDate: string;
  endDate: string;
  holidayCount: number;
};

function SetupFields({
  name,
  startDate,
  endDate,
  holidayCount,
  onNameChange,
  onStartDateChange,
  onEndDateChange,
  onHolidayCountChange,
}: {
  name: string;
  startDate: string;
  endDate: string;
  holidayCount: string;
  onNameChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onHolidayCountChange: (value: string) => void;
}) {
  return (
    <>
      <label>
        シフト名
        <input
          type="text"
          autoComplete="off"
          required
          maxLength={80}
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
        />
      </label>
      <label>
        開始年月日
        <DatePicker
          required
          value={startDate}
          max={endDate || undefined}
          onChange={onStartDateChange}
        />
      </label>
      <label>
        終了年月日
        <DatePicker
          required
          value={endDate}
          min={startDate || undefined}
          onChange={onEndDateChange}
        />
      </label>
      <label>
        公休数
        <span className="shift-form__number">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            required
            value={holidayCount}
            onChange={(event) => onHolidayCountChange(event.target.value)}
          />
          <span>日</span>
        </span>
      </label>
    </>
  );
}

function FormActions({
  children,
  error,
}: {
  children: ReactNode;
  error: string | null;
}) {
  return (
    <>
      {error ? <p className="auth-error">{error}</p> : null}
      <div className="shift-form__actions">{children}</div>
    </>
  );
}

/** 新規シフト表作成の初期設定（名称・期間・公休数） */
export function NewShiftPage() {
  const {
    draft,
    setDraft,
    cancelPath = "/home",
    unlockThrough,
    setupMode,
    setSetupMode,
  } = useOutletContext<NewShiftWizardContext>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { staff: staffPath, sheet: sheetPath, isEdit } = useShiftWizardPaths();
  const [name, setName] = useState(draft?.name ?? "");
  const [startDate, setStartDate] = useState(draft?.startDate ?? "");
  const [endDate, setEndDate] = useState(draft?.endDate ?? "");
  const [holidayCount, setHolidayCount] = useState(
    draft?.holidayCount != null ? String(draft.holidayCount) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ShiftSummary[]>([]);
  const [historyReady, setHistoryReady] = useState(isEdit);
  const [historyId, setHistoryId] = useState("");
  const [copying, setCopying] = useState(false);

  const hasHistory = history.length > 0;
  const showModeButtons = !isEdit && historyReady && hasHistory;
  const showScratchForm =
    isEdit || setupMode === "scratch" || (!isEdit && historyReady && !hasHistory);
  const showCopyForm = !isEdit && hasHistory && setupMode === "copy";

  useEffect(() => {
    if (isEdit || !token) {
      setHistoryReady(true);
      return;
    }

    let cancelled = false;
    fetchShifts(token)
      .then((rows) => {
        if (cancelled) return;
        setHistory(rows);
        setHistoryReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setHistory([]);
        setHistoryReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isEdit, token]);

  function readSetup(): SetupValues | null {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("シフト名を入力してください");
      return null;
    }
    if (!startDate) {
      setError("開始年月日を選択してください");
      return null;
    }
    if (!endDate) {
      setError("終了年月日を選択してください");
      return null;
    }
    if (endDate < startDate) {
      setError("終了年月日は開始年月日以降にしてください");
      return null;
    }

    const parsedHolidayCount = parseHolidayCount(holidayCount);
    if (parsedHolidayCount == null) {
      setError("公休数は0以上の整数で入力してください");
      return null;
    }

    const periodDays = inclusiveDayCount(startDate, endDate);
    if (parsedHolidayCount > periodDays) {
      setError(`公休数は期間内の日数（${periodDays}日）以下にしてください`);
      return null;
    }

    return {
      name: trimmedName,
      startDate,
      endDate,
      holidayCount: parsedHolidayCount,
    };
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const setup = readSetup();
    if (!setup) return;

    setDraft({
      name: setup.name,
      startDate: setup.startDate,
      endDate: setup.endDate,
      holidayCount: setup.holidayCount,
      staff: draft?.staff ?? [],
      dutyCounts: draft?.dutyCounts ?? [],
      shiftCounts: draft?.shiftCounts ?? [],
      sheet: draft?.sheet ?? createEmptySheet(),
      serverId: draft?.serverId,
    });
    unlockThrough("staff");
    navigate(staffPath);
  }

  async function handleCopyFromHistory() {
    setError(null);
    if (!hasHistory) return;

    const setup = readSetup();
    if (!setup) return;

    const selectedId = Number(historyId);
    if (!Number.isInteger(selectedId) || selectedId <= 0) {
      setError("履歴からシフト表を選択してください");
      return;
    }
    if (!token) {
      setError("ログインが必要です");
      return;
    }

    setCopying(true);
    try {
      const [sourceShift, staffMaster, dutyMaster, typeMaster] =
        await Promise.all([
          fetchShift(token, selectedId),
          fetchStaffs(token),
          fetchDuties(token),
          loadShiftTypesForUser(token),
        ]);
      const source = draftFromShiftDetail(sourceShift);
      const copied = copySettingsFromHistory({
        source,
        staffNames: new Set(
          staffMaster.map((row) => row.name.trim()).filter(Boolean),
        ),
        dutyNames: new Set(
          dutyMaster.map((row) => row.name.trim()).filter(Boolean),
        ),
        shiftTypeIds: new Set(typeMaster.map((row) => row.id)),
      });
      if (copied.staff.length === 0) {
        setError("コピー元のシフト表に職員がいません");
        return;
      }

      setDraft({
        name: setup.name,
        startDate: setup.startDate,
        endDate: setup.endDate,
        holidayCount: setup.holidayCount,
        staff: copied.staff,
        dutyCounts: copied.dutyCounts,
        shiftCounts: copied.shiftCounts,
        sheet: copied.sheet,
      });
      unlockThrough("sheet");
      navigate(sheetPath);
    } catch (caught: unknown) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "履歴からのコピーに失敗しました",
      );
    } finally {
      setCopying(false);
    }
  }

  const setupFields = (
    <SetupFields
      name={name}
      startDate={startDate}
      endDate={endDate}
      holidayCount={holidayCount}
      onNameChange={setName}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      onHolidayCountChange={setHolidayCount}
    />
  );

  if (!isEdit && !historyReady) {
    return (
      <div className="shift-form-page">
        <p className="auth-muted">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="shift-form-page">
      {showModeButtons ? (
        <div className="shift-setup-modes" role="group" aria-label="作成方法">
          <button
            type="button"
            className={
              setupMode === "scratch"
                ? "shift-setup-modes__btn is-selected"
                : "shift-setup-modes__btn"
            }
            onClick={() => {
              setSetupMode("scratch");
              setError(null);
            }}
          >
            ゼロからシフト表作成
          </button>
          <button
            type="button"
            className={
              setupMode === "copy"
                ? "shift-setup-modes__btn is-selected"
                : "shift-setup-modes__btn"
            }
            onClick={() => {
              setSetupMode("copy");
              setError(null);
            }}
          >
            履歴から設定を複写して作成
          </button>
        </div>
      ) : null}

      {showScratchForm ? (
        <form className="shift-form" onSubmit={handleSubmit} noValidate>
          {setupFields}
          <FormActions error={error}>
            <button type="submit" className="btn-primary" disabled={copying}>
              確定して次へ
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
              clearWizardPark();
              navigate(cancelPath);
            }}
              disabled={copying}
            >
              キャンセル
            </button>
          </FormActions>
        </form>
      ) : null}

      {showCopyForm ? (
        <form
          className="shift-form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCopyFromHistory();
          }}
          noValidate
        >
          <label>
            履歴から選択
            <select
              value={historyId}
              onChange={(event) => setHistoryId(event.target.value)}
            >
              <option value="">選択してください</option>
              {history.map((shift) => (
                <option key={shift.id} value={String(shift.id)}>
                  {shift.name}（{formatJaDate(shift.start_date)} 〜{" "}
                  {formatJaDate(shift.end_date)}）
                </option>
              ))}
            </select>
          </label>
          {setupFields}
          <FormActions error={error}>
            <button
              type="submit"
              className="btn-primary"
              disabled={copying || historyId === ""}
            >
              {copying ? "コピー中..." : "設定を複写して新規作成"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
              clearWizardPark();
              navigate(cancelPath);
            }}
              disabled={copying}
            >
              キャンセル
            </button>
          </FormActions>
        </form>
      ) : null}
    </div>
  );
}
