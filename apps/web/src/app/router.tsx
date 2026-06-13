import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { RequireAuth } from "../features/auth/RequireAuth";
import { AnalyticsPage } from "../pages/AnalyticsPage";
import { DirectoryPage } from "../pages/DirectoryPage";
import { EmployeeCreatePage } from "../pages/EmployeeCreatePage";
import { EmployeeDetailPage } from "../pages/EmployeeDetailPage";
import { EmployeeEditPage } from "../pages/EmployeeEditPage";
import { ImportExportPage } from "../pages/ImportExportPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";

/**
 * The route tree. `/login` sits outside the shell; the rest render inside it.
 * Route protection (the auth guard) wraps these in Phase 2; feature pages replace
 * the placeholders in Phases 3–6.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/employees" replace />} />
          <Route path="employees" element={<DirectoryPage />} />
          <Route path="employees/new" element={<EmployeeCreatePage />} />
          <Route path="employees/:id" element={<EmployeeDetailPage />} />
          <Route path="employees/:id/edit" element={<EmployeeEditPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="import-export" element={<ImportExportPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
