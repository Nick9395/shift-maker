import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { GuestRoute } from "./components/GuestRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { SignupPage } from "./pages/SignupPage";
import { TermsPage } from "./pages/TermsPage";
import { TopPage } from "./pages/TopPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TopPage />} />
          <Route path="/terms" element={<TermsPage />} />

          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>

          <Route path="/password/forgot" element={<ForgotPasswordPage />} />
          <Route path="/password/reset" element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
