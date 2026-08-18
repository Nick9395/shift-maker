export const LOGIN_WELCOME_DURATION_MS = 4000;

export type LoginWelcomeMessage = {
  name: string;
  body: string;
};

const LOGIN_WELCOME_BODIES = [
  "お疲れ様です。今日も頑張りましょう。",
  "ご苦労さまです。気楽にいきましょう。",
  "お疲れ様です。マイペースにいきましょう。",
  "お疲れ様です。いつもありがとうございます。",
] as const;

/** ログイン直後のヘッダー用メッセージを1つ選ぶ */
export function pickLoginWelcome(name: string): LoginWelcomeMessage {
  const index = Math.floor(Math.random() * LOGIN_WELCOME_BODIES.length);
  const body = LOGIN_WELCOME_BODIES[index] ?? LOGIN_WELCOME_BODIES[0];
  return { name, body };
}
