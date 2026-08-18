import { useState, type FormEvent } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { DatePicker } from "../components/DatePicker";
import { inclusiveDayCount } from "../lib/date";
import { useShiftWizardPaths } from "../lib/shiftWizard";
import { createEmptySheet } from "../types/shift";
import type { NewShiftWizardContext } from "./NewShiftLayout";

function parseHolidayCount(raw: string): number | null {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) return null;
  return value;
}

/** 新規シフト表作成の初期設定（名称・期間・公休数） */
export function NewShiftPage() {
  const { draft, setDraft, cancelPath = "/home" } =
    useOutletContext<NewShiftWizardContext>();
  const navigate = useNavigate();
  const { staff: staffPath, isEdit } = useShiftWizardPaths();
  const [name, setName] = useState(draft?.name ?? "");
  const [startDate, setStartDate] = useState(draft?.startDate ?? "");
  const [endDate, setEndDate] = useState(draft?.endDate ?? "");
  const [holidayCount, setHolidayCount] = useState(
    draft?.holidayCount != null ? String(draft.holidayCount) : "",
  );
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("シフト名を入力してください");
      return;
    }
    if (!startDate) {
      setError("開始年月日を選択してください");
      return;
    }
    if (!endDate) {
      setError("終了年月日を選択してください");
      return;
    }
    if (endDate < startDate) {
      setError("終了年月日は開始年月日以降にしてください");
      return;
    }

    const parsedHolidayCount = parseHolidayCount(holidayCount);
    if (parsedHolidayCount == null) {
      setError("公休数は0以上の整数で入力してください");
      return;
    }

    const periodDays = inclusiveDayCount(startDate, endDate);
    if (parsedHolidayCount > periodDays) {
      setError(`公休数は期間内の日数（${periodDays}日）以下にしてください`);
      return;
    }

    setDraft({
      name: trimmedName,
      startDate,
      endDate,
      holidayCount: parsedHolidayCount,
      staff: draft?.staff ?? [],
      dutyCounts: draft?.dutyCounts ?? [],
      sheet: draft?.sheet ?? createEmptySheet(),
      serverId: draft?.serverId,
    });
    navigate(staffPath);
  }

  return (
    <div className="shift-form-page">
      <h2>{isEdit ? "シフトの初期設定" : "新規シフト表作成"}</h2>
      <form className="shift-form" onSubmit={handleSubmit} noValidate>
        <label>
          シフト名
          <input
            type="text"
            autoComplete="off"
            required
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          開始年月日
          <DatePicker
            required
            value={startDate}
            max={endDate || undefined}
            onChange={setStartDate}
          />
        </label>
        <label>
          終了年月日
          <DatePicker
            required
            value={endDate}
            min={startDate || undefined}
            onChange={setEndDate}
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
              onChange={(event) => setHolidayCount(event.target.value)}
            />
            <span>日</span>
          </span>
        </label>
        {error ? <p className="auth-error">{error}</p> : null}
        <div className="shift-form__actions">
          <button type="submit" className="btn-primary">
            確定して次へ
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(cancelPath)}
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
