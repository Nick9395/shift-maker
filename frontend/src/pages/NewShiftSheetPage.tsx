import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { Navigate, useNavigate, useOutletContext } from "react-router-dom";
import { brushCursor } from "../lib/brushCursor";
import {
  eachIsoDate,
  formatJaDate,
  formatJaYearMonth,
  fromIsoDate,
  jaWeekday,
} from "../lib/date";
import { loadShiftTypes } from "../lib/shiftTypeStore";
import {
  createEmptySheet,
  isValidShiftPlan,
  MAX_SHIFT_TYPES,
  resolveShiftTypeColor,
  sheetCellKey,
  type DutyCountDraft,
  type ShiftSheetDraft,
  type ShiftStaffDraft,
  type ShiftTypeMaster,
} from "../types/shift";
import type { NewShiftWizardContext } from "./NewShiftLayout";

const SUMMARY_COLUMNS = ["出勤", "公休", "年休", "時間休", "特休"] as const;

type InteractionMode = "idle" | "paint" | "pan";

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

function shiftTypeById(
  types: ShiftTypeMaster[],
  id: string,
): ShiftTypeMaster | undefined {
  return types.find((type) => type.id === id);
}

function paletteStyle(color: string): {
  backgroundColor?: string;
  color?: string;
} | undefined {
  const hex = resolveShiftTypeColor(color);
  if (!hex) return undefined;
  return {
    backgroundColor: hex,
    color: "#fff",
  };
}

function cellFillStyle(color: string): CSSProperties | undefined {
  const hex = resolveShiftTypeColor(color);
  if (!hex) return undefined;
  return {
    backgroundColor: hex,
    color: "#fff",
  };
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

function isPlanInputTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element && target.closest("input, textarea") != null
  );
}

function shouldSkipPan(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return true;
  if (target.closest("button, a, input, select, textarea, label")) return true;
  if (target.closest(".shift-sheet-sticky")) return true;
  if (target.closest(".confirm-dialog")) return true;
  return false;
}

function readPaintCell(target: EventTarget | null): {
  staffId: string;
  isoDate: string;
} | null {
  if (!(target instanceof Element)) return null;
  const cell = target.closest("[data-sheet-cell]");
  if (!(cell instanceof HTMLElement)) return null;
  const staffId = cell.dataset.staffId;
  const isoDate = cell.dataset.isoDate;
  if (!staffId || !isoDate) return null;
  return { staffId, isoDate };
}

function formatClock(value: string): string {
  if (!value) return "未設定";
  return value;
}

function shiftTypeHoursLabel(type: ShiftTypeMaster): string {
  if (!type.startTime && !type.endTime) {
    return "勤務時間未設定";
  }
  return `${formatClock(type.startTime)}〜${formatClock(type.endTime)}`;
}

function PlanInput({
  value,
  disabled,
  ariaLabel,
  onChange,
}: {
  value: string;
  disabled: boolean;
  ariaLabel: string;
  onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      aria-label={ariaLabel}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function paintCellFromPoint(clientX: number, clientY: number): {
  staffId: string;
  isoDate: string;
} | null {
  const el = document.elementFromPoint(clientX, clientY);
  return readPaintCell(el);
}

/** シフト表作成画面 */
export function NewShiftSheetPage() {
  const { draft, setDraft } = useOutletContext<NewShiftWizardContext>();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [visibleShiftTypes, setVisibleShiftTypes] = useState(() =>
    loadShiftTypes().slice(0, MAX_SHIFT_TYPES),
  );

  const pageRef = useRef<HTMLDivElement>(null);
  const stickyHeaderRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef(draft);
  const cellsRef = useRef<Record<string, string>>({});
  const lockedIdsRef = useRef<string[]>([]);
  const allLockedRef = useRef(false);
  const selectedTypeIdRef = useRef<string | null>(null);
  const interactionRef = useRef<InteractionMode>("idle");
  const panRef = useRef({
    pointerId: 0,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  draftRef.current = draft;
  selectedTypeIdRef.current = selectedTypeId;

  const dates = useMemo(
    () => (draft ? eachIsoDate(draft.startDate, draft.endDate) : []),
    [draft],
  );

  useEffect(() => {
    const types = loadShiftTypes().slice(0, MAX_SHIFT_TYPES);
    setVisibleShiftTypes(types);
    setSelectedTypeId((current) =>
      current && types.some((type) => type.id === current) ? current : null,
    );
  }, []);

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

  useLayoutEffect(() => {
    const header = stickyHeaderRef.current;
    const page = pageRef.current;
    if (!header || !page) return;
    const scroller = page.closest(".app-shell__main");

    function applyMetrics() {
      if (!header || !page) return;
      const viewportWidth = scroller instanceof HTMLElement
        ? scroller.clientWidth
        : header.getBoundingClientRect().width;
      page.style.setProperty(
        "--sheet-sticky-top",
        `${header.getBoundingClientRect().height}px`,
      );
      page.style.setProperty("--sheet-viewport-width", `${viewportWidth}px`);
    }

    applyMetrics();
    const observer = new ResizeObserver(applyMetrics);
    observer.observe(header);
    if (scroller instanceof HTMLElement) {
      observer.observe(scroller);
    }
    return () => observer.disconnect();
  }, [draft, visibleShiftTypes]);

  if (!draft) {
    return <Navigate to="/shifts/new" replace />;
  }

  if (draft.staff.length === 0) {
    return <Navigate to="/shifts/new/staff" replace />;
  }

  const currentDraft = draft;
  const sheet = mergeSheet(currentDraft.sheet, {});
  const { plans, cells, lockedShiftTypeIds, allLocked } = sheet;
  cellsRef.current = cells;
  lockedIdsRef.current = lockedShiftTypeIds;
  allLockedRef.current = allLocked;
  const periodSameMonth =
    formatJaYearMonth(currentDraft.startDate) ===
    formatJaYearMonth(currentDraft.endDate);
  const selectedType = selectedTypeId
    ? shiftTypeById(visibleShiftTypes, selectedTypeId)
    : undefined;
  const brushCursorCss = selectedType
    ? brushCursor(resolveShiftTypeColor(selectedType.iconColor))
    : undefined;

  function updateSheet(patch: Partial<ShiftSheetDraft>) {
    const current = draftRef.current;
    if (!current) return;
    setIsSaved(false);
    setDraft({
      ...current,
      sheet: mergeSheet(current.sheet, patch),
    });
  }

  function handleSave() {
    for (const iso of dates) {
      if (!isValidShiftPlan(plans[iso] ?? "")) {
        setSaveError(
          `${formatJaDate(iso)}の予定は全角28文字以内にしてください`,
        );
        return;
      }
    }
    setSaveError(null);
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
    setSaveError(null);
    updateSheet({
      plans: {
        ...plans,
        [iso]: value,
      },
    });
  }

  function getMainScroller(): HTMLElement | null {
    return pageRef.current?.closest(".app-shell__main") ?? null;
  }

  function hideTooltip() {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;
    tooltip.hidden = true;
    tooltip.textContent = "";
  }

  function showTooltip(text: string, event: ReactMouseEvent) {
    if (!text) {
      hideTooltip();
      return;
    }
    const tooltip = tooltipRef.current;
    if (!tooltip) return;
    tooltip.hidden = false;
    tooltip.textContent = text;
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
  }

  function paintCell(staffId: string, isoDate: string) {
    const typeId = selectedTypeIdRef.current;
    if (!typeId) return;
    if (allLockedRef.current) return;

    const key = sheetCellKey(staffId, isoDate);
    const existing = cellsRef.current[key];
    if (existing && lockedIdsRef.current.includes(existing)) return;
    if (existing === typeId) return;

    const nextCells = { ...cellsRef.current, [key]: typeId };
    cellsRef.current = nextCells;
    updateSheet({ cells: nextCells });
  }

  function endInteraction(event: ReactPointerEvent<HTMLDivElement>) {
    if (interactionRef.current === "idle") return;
    interactionRef.current = "idle";
    const page = pageRef.current;
    page?.classList.remove("is-painting", "is-panning");
    if (page?.hasPointerCapture(event.pointerId)) {
      page.releasePointerCapture(event.pointerId);
    }
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    hideTooltip();

    const page = pageRef.current;
    const scroller = getMainScroller();
    if (!page || !scroller) return;

    const paintTarget = readPaintCell(event.target);
    if (
      paintTarget &&
      selectedTypeIdRef.current &&
      !allLockedRef.current &&
      !isPlanInputTarget(event.target)
    ) {
      event.preventDefault();
      panRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        scrollLeft: scroller.scrollLeft,
        scrollTop: scroller.scrollTop,
      };
      interactionRef.current = "paint";
      page.classList.add("is-painting");
      page.setPointerCapture(event.pointerId);
      paintCell(paintTarget.staffId, paintTarget.isoDate);
      return;
    }

    if (shouldSkipPan(event.target)) return;

    event.preventDefault();
    interactionRef.current = "pan";
    panRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: scroller.scrollLeft,
      scrollTop: scroller.scrollTop,
    };
    page.classList.add("is-panning");
    page.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const mode = interactionRef.current;
    if (mode === "idle") return;
    if (event.pointerId !== panRef.current.pointerId) return;

    if (mode === "paint") {
      const paintTarget = paintCellFromPoint(event.clientX, event.clientY);
      if (paintTarget) {
        paintCell(paintTarget.staffId, paintTarget.isoDate);
      }
      return;
    }

    const scroller = getMainScroller();
    if (!scroller) return;
    const pan = panRef.current;
    scroller.scrollLeft = pan.scrollLeft - (event.clientX - pan.startX);
    scroller.scrollTop = pan.scrollTop - (event.clientY - pan.startY);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerId !== panRef.current.pointerId) return;
    endInteraction(event);
  }

  function handleLostPointerCapture(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    endInteraction(event);
  }

  return (
    <div
      ref={pageRef}
      className={[
        "shift-sheet-page",
        selectedType ? "has-brush" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        brushCursorCss
          ? ({ "--sheet-brush-cursor": brushCursorCss } as CSSProperties)
          : undefined
      }
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onLostPointerCapture={handleLostPointerCapture}
      onDragStart={(event) => event.preventDefault()}
    >
      <header ref={stickyHeaderRef} className="shift-sheet-sticky">
        <div className="shift-sheet-sticky__inner">
        {visibleShiftTypes.length > 0 ? (
          <div className="shift-palette" aria-label="シフト種別">
            {visibleShiftTypes.map((type) => {
              const locked = isTypeLocked(type.id);
              const selected = selectedTypeId === type.id;
              return (
                <div
                  key={type.id}
                  className={[
                    "shift-palette__item",
                    locked ? "is-locked" : "",
                    type.iconColor && resolveShiftTypeColor(type.iconColor)
                      ? "is-colored"
                      : "",
                    selected ? "is-selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <button
                    type="button"
                    className="shift-palette__btn"
                    style={paletteStyle(type.iconColor)}
                    aria-pressed={selected}
                    aria-label={`${type.name} ${shiftTypeHoursLabel(type)}`}
                    onClick={() => setSelectedTypeId(type.id)}
                    onMouseEnter={(event) =>
                      showTooltip(shiftTypeHoursLabel(type), event)
                    }
                    onMouseMove={(event) =>
                      showTooltip(shiftTypeHoursLabel(type), event)
                    }
                    onMouseLeave={hideTooltip}
                  >
                    <span className="shift-palette__name">{type.name}</span>
                    <span className="shift-palette__abbr">
                      {type.abbreviation}
                    </span>
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
              Excel出力
            </button>
            <button
              type="button"
              className="btn-secondary btn-sheet-action"
              onClick={() => navigate("/settings")}
            >
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
        {saveError ? <p className="auth-error">{saveError}</p> : null}
        </div>
      </header>

      <div className="shift-sheet-body">
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

      <div className="shift-sheet-table-frame">
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
              <tr key={member.id} className="shift-sheet-staff-row">
                <th className="col-name" scope="row">
                  {member.name}
                </th>
                <td className="col-duty">{formatStaffDuties(member)}</td>
                {dates.map((iso) => {
                  const shiftTypeId = cells[sheetCellKey(member.id, iso)];
                  const shiftType = shiftTypeId
                    ? shiftTypeById(visibleShiftTypes, shiftTypeId)
                    : undefined;
                  const locked = isCellLocked(shiftTypeId);
                  return (
                    <td
                      key={iso}
                      data-sheet-cell=""
                      data-staff-id={member.id}
                      data-iso-date={iso}
                      className={`col-date ${dateClassName(iso)}${locked ? " is-locked" : ""}`}
                      style={cellFillStyle(shiftType?.iconColor ?? "")}
                      aria-label={
                        shiftType
                          ? `${member.name} ${formatJaDate(iso)} ${shiftType.name}`
                          : `${member.name} ${formatJaDate(iso)}`
                      }
                      onMouseEnter={
                        shiftType
                          ? (event) => showTooltip(shiftType.name, event)
                          : undefined
                      }
                      onMouseMove={
                        shiftType
                          ? (event) => showTooltip(shiftType.name, event)
                          : undefined
                      }
                      onMouseLeave={shiftType ? hideTooltip : undefined}
                    >
                      <div className="shift-sheet-cell">
                        {shiftType ? (
                          <span className="shift-sheet-cell__value">
                            {shiftType.abbreviation}
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
                  <PlanInput
                    ariaLabel={`${formatJaDate(iso)}の予定`}
                    value={plans[iso] ?? ""}
                    disabled={allLocked}
                    onChange={(value) => updatePlan(iso, value)}
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
      <div ref={tooltipRef} className="shift-tooltip" hidden />
    </div>
  );
}
