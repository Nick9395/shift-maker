const DAY_MS = 24 * 60 * 60 * 1000;

/** ローカル日付を YYYY-MM-DD にする */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** YYYY-MM-DD をローカル Date にする */
export function fromIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** 画面表示用（例: 2026年8月16日） */
export function formatJaDate(iso: string): string {
  const date = fromIsoDate(iso);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** 曜日（日〜土） */
export function jaWeekday(iso: string): (typeof WEEKDAYS_JA)[number] {
  return WEEKDAYS_JA[fromIsoDate(iso).getDay()];
}

/** 開始日から終了日までの日付を途切れず列挙する */
export function eachIsoDate(startIso: string, endIso: string): string[] {
  const dates: string[] = [];
  const current = fromIsoDate(startIso);
  const end = fromIsoDate(endIso);
  while (current.getTime() <= end.getTime()) {
    dates.push(toIsoDate(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/** 開始日から終了日までの日数（両端を含む） */
export function inclusiveDayCount(startIso: string, endIso: string): number {
  const start = fromIsoDate(startIso);
  const end = fromIsoDate(endIso);
  return Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
}
