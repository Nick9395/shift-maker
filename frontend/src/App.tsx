import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { GuestRoute } from "./components/GuestRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { NewShiftDutiesPage } from "./pages/NewShiftDutiesPage";
import { NewShiftLayout } from "./pages/NewShiftLayout";
import { NewShiftPage } from "./pages/NewShiftPage";
import { NewShiftSheetPage } from "./pages/NewShiftSheetPage";
import { NewShiftStaffPage } from "./pages/NewShiftStaffPage";
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
            <Route path="/shifts/new" element={<NewShiftLayout />}>
              <Route index element={<NewShiftPage />} />
              <Route path="staff" element={<NewShiftStaffPage />} />
              <Route path="duties" element={<NewShiftDutiesPage />} />
              <Route path="sheet" element={<NewShiftSheetPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
