import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/** ログイン済みならホームへ戻す（ログイン/サインアップ画面用） */
export function GuestRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-page">
        <p className="auth-muted">読み込み中...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
