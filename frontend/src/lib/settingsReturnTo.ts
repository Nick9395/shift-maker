import { useSearchParams } from "react-router-dom";

const RETURN_TO_PARAM = "returnTo";
/** シフト作成・編集の途中画面とシート以外へのリダイレクトを防ぐ */
const RETURN_TO_PATTERN =
  /^\/shifts\/(?:new\/(?:staff|duties|shift-counts)|\d+\/(?:staff|duties|shift-counts|sheet))$/;

/** 設定画面の戻り先として使えるパスだけを通す */
export function parseSettingsReturnTo(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined;
  return RETURN_TO_PATTERN.test(value) ? value : undefined;
}

/** 戻り先付きの設定URLを組み立てる */
export function settingsHref(pathname: string, returnTo?: string): string {
  if (!returnTo) return pathname;
  const params = new URLSearchParams();
  params.set(RETURN_TO_PARAM, returnTo);
  return `${pathname}?${params.toString()}`;
}

/** 設定画面に渡されたシフト表への戻り先 */
export function useSettingsReturnTo(): string | undefined {
  const [searchParams] = useSearchParams();
  return parseSettingsReturnTo(searchParams.get(RETURN_TO_PARAM));
}
