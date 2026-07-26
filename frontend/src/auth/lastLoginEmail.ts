const LAST_LOGIN_EMAIL_KEY = "shift_maker_last_login_email";

/** ログアウト時のリダイレクト競合でもメールを復元できるよう sessionStorage に保持する */
export function getLastLoginEmail(): string {
  return sessionStorage.getItem(LAST_LOGIN_EMAIL_KEY) ?? "";
}

export function setLastLoginEmail(email: string): void {
  if (email) {
    sessionStorage.setItem(LAST_LOGIN_EMAIL_KEY, email);
  }
}
