import type { DutyMaster } from "../types/shift";

type DutySelectProps = {
  value: string;
  duties: readonly DutyMaster[];
  ariaLabel: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

/** 職務マスタから選ぶ専用。手入力はできない */
export function DutySelect({
  value,
  duties,
  ariaLabel,
  onChange,
  placeholder = "選択してください",
}: DutySelectProps) {
  const names = duties.map((duty) => duty.name);
  const keepCurrent = value.trim() !== "" && !names.includes(value);

  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{placeholder}</option>
      {keepCurrent ? <option value={value}>{value}</option> : null}
      {duties.map((duty) => (
        <option key={duty.id} value={duty.name}>
          {duty.name}
        </option>
      ))}
    </select>
  );
}
