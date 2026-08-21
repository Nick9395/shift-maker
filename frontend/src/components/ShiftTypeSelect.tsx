import type { ShiftTypeMaster } from "../types/shift";

type ShiftTypeSelectProps = {
  value: string;
  types: readonly ShiftTypeMaster[];
  allTypes?: readonly ShiftTypeMaster[];
  ariaLabel: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

/** シフト種別マスタから選ぶ専用。手入力はできない */
export function ShiftTypeSelect({
  value,
  types,
  allTypes,
  ariaLabel,
  onChange,
  placeholder = "選択してください",
}: ShiftTypeSelectProps) {
  const ids = types.map((type) => type.id);
  const keepCurrent = value.trim() !== "" && !ids.includes(value);
  const currentLabel =
    (allTypes ?? types).find((type) => type.id === value)?.name ?? value;

  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{placeholder}</option>
      {keepCurrent ? <option value={value}>{currentLabel}</option> : null}
      {types.map((type) => (
        <option key={type.id} value={type.id}>
          {type.name}
        </option>
      ))}
    </select>
  );
}
