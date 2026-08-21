import { wizardStepFromPath, type WizardStepId } from "./shiftWizard";

/** 現在の画面に対応するヒント。未定義の画面は null */
export function hintLinesForPath(pathname: string): string[] | null {
  if (pathname === "/home") {
    return HOME_HINTS;
  }
  if (pathname === "/shifts/new") {
    return NEW_SHIFT_SETUP_HINTS;
  }
  const step = wizardStepFromPath(pathname);
  if (!step) return null;
  return WIZARD_HINTS[step];
}

/** ヘッダー見出し。null のときは「xxxxさんのページ」 */
export function headerTitleForPath(pathname: string): string | null {
  const step = wizardStepFromPath(pathname);
  if (step === "setup") return "シフト作成初期設定";
  if (step === "staff") return "職員情報を設定";
  if (step === "duties") return "職務カウント設定";
  if (step === "shiftCounts") return "シフトカウント設定";
  if (step === "sheet") return null;

  if (pathname === "/shifts") return "シフト表一覧";
  if (pathname === "/settings") return "設定";
  if (pathname === "/settings/duties") return "職務を登録する";
  if (pathname === "/settings/staff") return "職員を登録する";
  if (pathname === "/settings/shift-types") return "シフト種別を登録する";
  if (pathname === "/settings/account") return "アカウント設定";
  return null;
}

const HOME_HINTS = [
  "新規シフト表作成する前に設定画面で職員の名前や職務、シフト種別などを設定しましょう。設定漏れがあっても後から修正できるので心配いりません。",
];

const NEW_SHIFT_SETUP_HINTS = [
  "履歴のシフト表で設定された「職員名」、「職務」、「カウントする職務」とその設定、「シフトカウント名」とその設定を自動転記して新規シフト作成を始められます。",
  "履歴が0件のとき、この機能は使えません。",
];

const WIZARD_HINTS: Record<WizardStepId, string[]> = {
  setup: [
    "シフト表の名前、期間、公休数を入力します。",
    "公休数は期間の日数以下にしてください。",
  ],
  staff: [
    "この表に載せる職員と、それぞれの職務を設定します。",
    "職員名は一覧から選ぶか、直接入力できます。",
    "同一職員の職務1〜3に、同じ職務は選べません。",
    "同名の職員がいる場合は、氏名の左に注意マークが出ます。",
  ],
  duties: [
    "日付ごとの必要人数と、不足時の通知を設定します。",
    "同じ職務は複数行に選べません。",
  ],
  shiftCounts: [
    "シフトカウント名は自由に付けられます。属する種別は一覧から選びます。",
    "同じ種別は複数行に選べません。日勤1〜4のように同じ枠で数えたい種別は、行内で追加してください。",
    "未設定のまま次へ進むと、表にはシフトカウント行が出ません。",
  ],
  sheet: [
    "種別を選んでマスをクリック／ドラッグすると塗り絵感覚でシフトが入力できます。",
    "間違えたら消しゴムを選ぶか、マスを右クリック／右ドラッグすると消せます。",
    "ロックをONにしている種別は上書き・消去できません。再編集する場合はOFFにしてください。",
    "職務カウント・シフトカウント・公休数が合わない場合、数字が赤く表示されます。",
    "Excel出力では、出す項目と赤文字にする種別を選べます。",
  ],
};
