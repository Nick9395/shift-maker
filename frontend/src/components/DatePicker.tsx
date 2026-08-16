import { useEffect, useId, useMemo, useRef, useState } from "react";
import { formatJaDate, fromIsoDate, toIsoDate } from "../lib/date";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

type DatePickerProps = {
  id?: string;
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
};

type MonthView = {
  year: number;
  month: number;
};

function toMonthView(iso: string | undefined): MonthView {
  const source = iso ? fromIsoDate(iso) : new Date();
  return { year: source.getFullYear(), month: source.getMonth() };
}

function shiftMonth(view: MonthView, delta: number): MonthView {
  const date = new Date(view.year, view.month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

function isDisabled(iso: string, min?: string, max?: string): boolean {
  if (min && iso < min) return true;
  if (max && iso > max) return true;
  return false;
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm12 8H5v9h14V10Z"
      />
    </svg>
  );
}

/** カレンダーから年月日を選ぶ入力 */
export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  required = false,
}: DatePickerProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<MonthView>(() => toMonthView(value));

  useEffect(() => {
    if (open) {
      setView(toMonthView(value || min));
    }
  }, [open, value, min]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
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

  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const todayIso = toIsoDate(new Date());
    const items: Array<{
      key: string;
      day: number | null;
      iso: string;
      selected: boolean;
      today: boolean;
      disabled: boolean;
    }> = [];

    for (let i = 0; i < startWeekday; i += 1) {
      items.push({
        key: `empty-${i}`,
        day: null,
        iso: "",
        selected: false,
        today: false,
        disabled: true,
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const iso = toIsoDate(new Date(view.year, view.month, day));
      items.push({
        key: iso,
        day,
        iso,
        selected: iso === value,
        today: iso === todayIso,
        disabled: isDisabled(iso, min, max),
      });
    }

    return items;
  }, [view, value, min, max]);

  const display = value ? formatJaDate(value) : "";

  function selectDate(iso: string) {
    onChange(iso);
    setOpen(false);
  }

  return (
    <div className="date-picker" ref={rootRef}>
      <button
        type="button"
        id={inputId}
        className="date-picker__trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-required={required}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={display ? undefined : "date-picker__placeholder"}>
          {display || "カレンダーから選択"}
        </span>
        <CalendarIcon />
      </button>
      {open ? (
        <div className="date-picker__popover" role="dialog" aria-label="カレンダー">
          <div className="date-picker__nav">
            <button
              type="button"
              className="date-picker__nav-btn"
              onClick={() => setView((current) => shiftMonth(current, -12))}
              aria-label="前年"
            >
              «
            </button>
            <button
              type="button"
              className="date-picker__nav-btn"
              onClick={() => setView((current) => shiftMonth(current, -1))}
              aria-label="前月"
            >
              ‹
            </button>
            <p className="date-picker__month">
              {view.year}年{view.month + 1}月
            </p>
            <button
              type="button"
              className="date-picker__nav-btn"
              onClick={() => setView((current) => shiftMonth(current, 1))}
              aria-label="翌月"
            >
              ›
            </button>
            <button
              type="button"
              className="date-picker__nav-btn"
              onClick={() => setView((current) => shiftMonth(current, 12))}
              aria-label="翌年"
            >
              »
            </button>
          </div>
          <div className="date-picker__weekdays">
            {WEEKDAYS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="date-picker__grid">
            {cells.map((cell) =>
              cell.day == null ? (
                <span key={cell.key} className="date-picker__cell is-empty" />
              ) : (
                <button
                  key={cell.key}
                  type="button"
                  className={[
                    "date-picker__cell",
                    cell.selected ? "is-selected" : "",
                    cell.today ? "is-today" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={cell.disabled}
                  onClick={() => selectDate(cell.iso)}
                >
                  {cell.day}
                </button>
              ),
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
