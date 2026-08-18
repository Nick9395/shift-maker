import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export type SuggestOption = {
  id: string;
  label: string;
};

type SuggestInputProps = {
  value: string;
  options: readonly SuggestOption[];
  onChange: (value: string) => void;
  maxLength?: number;
  ariaLabel: string;
  emptyMessage?: string;
  noMatchMessage?: string;
};

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M7.4 9.4 12 14l4.6-4.6L18 10.8l-6 6-6-6 1.4-1.4Z" />
    </svg>
  );
}

/** 手入力と候補選択を両立する入力欄 */
export function SuggestInput({
  value,
  options,
  onChange,
  maxLength,
  ariaLabel,
  emptyMessage = "候補がありません",
  noMatchMessage = "一致する候補がありません",
}: SuggestInputProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [filterEnabled, setFilterEnabled] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => {
    if (!filterEnabled) return options;
    const query = value.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  }, [filterEnabled, options, value]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [filtered, open]);

  function selectOption(label: string) {
    onChange(label);
    setOpen(false);
    inputRef.current?.focus();
  }

  function toggleList() {
    setOpen((current) => {
      if (current) return false;
      setFilterEnabled(false);
      return true;
    });
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        setOpen(false);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setFilterEnabled(value.trim() !== "");
        setOpen(true);
        return;
      }
      if (filtered.length === 0) return;
      setActiveIndex((current) => (current + 1) % filtered.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setFilterEnabled(value.trim() !== "");
        setOpen(true);
        return;
      }
      if (filtered.length === 0) return;
      setActiveIndex(
        (current) => (current - 1 + filtered.length) % filtered.length,
      );
      return;
    }

    if (event.key === "Enter" && open) {
      event.preventDefault();
      const option = filtered[activeIndex];
      if (option) selectOption(option.label);
    }
  }

  const activeId =
    open && filtered[activeIndex]
      ? `${listId}-option-${filtered[activeIndex].id}`
      : undefined;

  return (
    <div className="suggest-input" ref={rootRef}>
      <input
        ref={inputRef}
        type="text"
        maxLength={maxLength}
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        autoComplete="off"
        value={value}
        onChange={(event) => {
          if (open) setFilterEnabled(true);
          onChange(event.target.value);
        }}
        onKeyDown={handleKeyDown}
      />
      <button
        type="button"
        className="suggest-input__toggle"
        tabIndex={-1}
        aria-label={`${ariaLabel}の候補を開く`}
        aria-expanded={open}
        aria-controls={listId}
        onClick={toggleList}
      >
        <ChevronIcon />
      </button>
      {open ? (
        <ul className="suggest-input__list" id={listId} role="listbox">
          {options.length === 0 ? (
            <li className="suggest-input__empty">{emptyMessage}</li>
          ) : filtered.length === 0 ? (
            <li className="suggest-input__empty">{noMatchMessage}</li>
          ) : (
            filtered.map((option, index) => {
              const selected = option.label === value;
              const active = index === activeIndex;
              return (
                <li key={option.id} role="presentation">
                  <button
                    type="button"
                    id={`${listId}-option-${option.id}`}
                    className={[
                      "suggest-input__option",
                      selected ? "is-selected" : "",
                      active ? "is-active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectOption(option.label)}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
