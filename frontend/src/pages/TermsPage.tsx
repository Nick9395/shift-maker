import { Link } from "react-router-dom";

/** 利用規約の仮画面（本文は後続で差し替え） */
export function TermsPage() {
  return (
    <div className="terms-page">
      <article className="terms-card">
        <header className="terms-card__header">
          <h1>利用規約</h1>
        </header>
        <div className="terms-card__body">
          <p>本ページは利用規約の仮表示です。正式な条文は今後掲載します。</p>
          <ol>
            <li>本サービス「Shift Maker」はシフト作成・共有を目的としたアプリケーションです。</li>
            <li>利用者は法令および本規約に従ってサービスを利用するものとします。</li>
            <li>アカウント情報は利用者本人が適切に管理してください。</li>
            <li>サービス内容は予告なく変更・停止される場合があります。</li>
          </ol>
          <p className="auth-muted">※ 上記はプレースホルダ文言です。</p>
          <Link to="/" className="terms-back">
            トップへ戻る
          </Link>
        </div>
      </article>
    </div>
  );
}
