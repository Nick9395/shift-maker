import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStaffs, replaceStaffs } from "../api/staffs";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AppShell } from "../components/AppShell";
import { FlashToast, useFlash } from "../components/FlashToast";
import { RowReorderButtons } from "../components/RowReorderButtons";
import { moveItem } from "../lib/moveItem";
import { useSettingsReturnTo } from "../lib/settingsReturnTo";
import {
  createEmptyStaff,
  MAX_SHIFT_STAFF,
  MAX_STAFF_NAME,
  type StaffMaster,
} from "../types/shift";

function isBlankRow(row: StaffMaster): boolean {
  return row.name.trim() === "";
}

function toStoredStaff(rows: StaffMaster[]): StaffMaster[] {
  return rows
    .filter((row) => !isBlankRow(row))
    .map((row) => ({
      ...row,
      name: row.name.trim(),
    }));
}

function initialRows(staffs: StaffMaster[]): StaffMaster[] {
  if (staffs.length > 0) {
    return staffs.map((row) => ({ ...row }));
  }
  return [createEmptyStaff()];
}

/** 職員マスタを登録する */
export function StaffSettingsPage() {
  const navigate = useNavigate();
  const returnTo = useSettingsReturnTo();
  const { token } = useAuth();
  const [rows, setRows] = useState<StaffMaster[]>(() => [createEmptyStaff()]);
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
    fetchStaffs(token)
      .then((staffs) => {
        if (!cancelled) setRows(initialRows(staffs));
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(
          caught instanceof ApiError
            ? caught.message
            : "職員を読み込めませんでした",
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

  function updateRow(id: string, name: string) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, name } : row)),
    );
  }

  function addRow() {
    if (rows.length >= MAX_SHIFT_STAFF) return;
    setRows((current) => [...current, createEmptyStaff()]);
  }

  function removeRow(id: string) {
    setRows((current) => {
      const next = current.filter((row) => row.id !== id);
      return next.length === 0 ? [createEmptyStaff()] : next;
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
        setError(`${index + 1}行目の職員氏名を入力してください`);
        return;
      }
    }

    const stored = toStoredStaff(rows);
    if (stored.length > MAX_SHIFT_STAFF) {
      setError(`職員は${MAX_SHIFT_STAFF}人まで登録できます`);
      return;
    }
    if (!token) {
      setError("ログインが必要です");
      return;
    }

    setSaving(true);
    try {
      await replaceStaffs(token, stored);
      showFlash("保存しました");
    } catch (caught: unknown) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "職員の保存に失敗しました",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <FlashToast message={flashMessage} />
      <div className="shift-form-page shift-form-page--wide">
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
              <table className="shift-staff-table">
                <thead>
                  <tr>
                    <th scope="col">職員氏名</th>
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
                          maxLength={MAX_STAFF_NAME}
                          aria-label={`${index + 1}行目の職員氏名`}
                          value={row.name}
                          onChange={(event) =>
                            updateRow(row.id, event.target.value)
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
                disabled={rows.length >= MAX_SHIFT_STAFF}
              >
                ＋ 行追加
              </button>
              <p className="shift-staff-count">
                登録数 {filledCount} / {MAX_SHIFT_STAFF}
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
                onClick={() => navigate(returnTo ?? "/settings")}
                disabled={saving}
              >
                {returnTo ? "編集画面にもどる" : "もどる"}
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
