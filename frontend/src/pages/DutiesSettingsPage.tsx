import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { fetchDuties, replaceDuties } from "../api/duties";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AppShell } from "../components/AppShell";
import { FlashToast, useFlash } from "../components/FlashToast";
import { RowReorderButtons } from "../components/RowReorderButtons";
import { moveItem } from "../lib/moveItem";
import {
  createEmptyDuty,
  isValidDutyAbbr,
  MAX_DUTIES,
  type DutyMaster,
} from "../types/shift";

function isBlankRow(row: DutyMaster): boolean {
  return row.name.trim() === "" && row.abbreviation.trim() === "";
}

function toStoredDuties(rows: DutyMaster[]): DutyMaster[] {
  return rows
    .filter((row) => !isBlankRow(row))
    .map((row) => ({
      ...row,
      name: row.name.trim(),
      abbreviation: row.abbreviation.trim(),
    }));
}

function initialRows(duties: DutyMaster[]): DutyMaster[] {
  if (duties.length > 0) {
    return duties.map((row) => ({ ...row }));
  }
  return [createEmptyDuty()];
}

/** 職務マスタを登録する */
export function DutiesSettingsPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [rows, setRows] = useState<DutyMaster[]>(() => [createEmptyDuty()]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { flashMessage, showFlash } = useFlash();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    fetchDuties(token)
      .then((duties) => {
        if (!cancelled) setRows(initialRows(duties));
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(
          caught instanceof ApiError
            ? caught.message
            : "職務を読み込めませんでした",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const filledCount = rows.filter((row) => !isBlankRow(row)).length;

  function updateRow<K extends keyof DutyMaster>(
    id: string,
    field: K,
    value: DutyMaster[K],
  ) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  }

  function addRow() {
    if (rows.length >= MAX_DUTIES) return;
    setRows((current) => [...current, createEmptyDuty()]);
  }

  function removeRow(id: string) {
    setRows((current) => {
      const next = current.filter((row) => row.id !== id);
      return next.length === 0 ? [createEmptyDuty()] : next;
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    for (const [index, row] of rows.entries()) {
      if (isBlankRow(row)) continue;
      if (!row.name.trim()) {
        setError(`${index + 1}行目の職務名を入力してください`);
        return;
      }
      if (!isValidDutyAbbr(row.abbreviation.trim())) {
        setError(
          `${index + 1}行目の略称は半角6文字または全角3文字以内にしてください`,
        );
        return;
      }
    }

    const stored = toStoredDuties(rows);
    if (stored.length > MAX_DUTIES) {
      setError(`職務は${MAX_DUTIES}件まで登録できます`);
      return;
    }
    if (!token) {
      setError("ログインが必要です");
      return;
    }

    setSaving(true);
    try {
      await replaceDuties(token, stored);
      showFlash("保存しました");
    } catch (caught: unknown) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "職務の保存に失敗しました",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <FlashToast message={flashMessage} />
      <div className="shift-form-page shift-form-page--wide">
        <h2>職務を登録する</h2>
        {loading ? <p className="auth-muted">読み込み中...</p> : null}
        {loading ? null : (
          <form
            className="shift-staff-form"
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            noValidate
          >
            <div className="shift-staff-table-wrap">
              <table className="shift-staff-table shift-staff-table--duties">
                <thead>
                  <tr>
                    <th scope="col">職務名</th>
                    <th scope="col">略称（全角3文字以内）</th>
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
                        <input
                          type="text"
                          maxLength={40}
                          aria-label={`${index + 1}行目の職務名`}
                          value={row.name}
                          onChange={(event) =>
                            updateRow(row.id, "name", event.target.value)
                          }
                        />
                      </td>
                      <td className="shift-staff-table__duty-abbr">
                        <input
                          type="text"
                          size={6}
                          aria-label={`${index + 1}行目の略称`}
                          value={row.abbreviation}
                          onChange={(event) =>
                            updateRow(
                              row.id,
                              "abbreviation",
                              event.target.value,
                            )
                          }
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
                disabled={rows.length >= MAX_DUTIES}
              >
                行追加
              </button>
              <p className="shift-staff-count">
                登録数 {filledCount} / {MAX_DUTIES}
              </p>
            </div>

            {error ? <p className="auth-error">{error}</p> : null}

            <div className="shift-form__actions shift-form__actions--equal">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate("/settings")}
                disabled={saving}
              >
                もどる
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate("/shifts")}
                disabled={saving}
              >
                シフト一覧へ
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
