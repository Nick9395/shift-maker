/** 現在の画面に対応するヒント。未定義の画面は null */
export function hintLinesForPath(pathname: string): string[] | null {
  const step = wizardStepFromPath(pathname);
  if (!step) return null;
  return WIZARD_HINTS[step];
}

type WizardStep = "setup" | "staff" | "duties" | "sheet";

const WIZARD_HINTS: Record<WizardStep, string[]> = {
  setup: [
    "シフト表の名前、期間、公休数を入力します。",
    "公休数は期間の日数以下にしてください。",
  ],
  staff: [
    "この表に載せる職員と、それぞれの職務を設定します。",
    "職員名は一覧から選ぶか、直接入力できます。",
  ],
  duties: [
    "日付ごとの必要人数と、不足時の通知を設定します。",
    "同じ職務は複数行に選べません。",
  ],
  sheet: [
    "種別を選んでマスをクリック／ドラッグすると塗り絵感覚でシフトが入力できます。",
    "間違えたら消しゴムを選ぶか、マスを右クリック／右ドラッグすると消せます。",
    "ロックをONにしている種別は上書き・消去できません。再編集する場合はOFFにしてください。",
    "職務カウントや公休数が合わない場合、数字が赤く表示されます。",
  ],
};

function wizardStepFromPath(pathname: string): WizardStep | null {
  if (pathname === "/shifts/new" || /^\/shifts\/\d+$/.test(pathname)) {
    return "setup";
  }
  if (pathname === "/shifts/new/staff" || /^\/shifts\/\d+\/staff$/.test(pathname)) {
    return "staff";
  }
  if (
    pathname === "/shifts/new/duties" ||
    /^\/shifts\/\d+\/duties$/.test(pathname)
  ) {
    return "duties";
  }
  if (pathname === "/shifts/new/sheet" || /^\/shifts\/\d+\/sheet$/.test(pathname)) {
    return "sheet";
  }
  return null;
}
