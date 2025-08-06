import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import WhitelistPlatesPage from "./pages/WhitelistPlatesPage";
import WhitelistTradeLicensesPage from "./pages/WhitelistTradeLicensesPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="whitelist">
          <Route index element={<Navigate to="/whitelist/plates" replace />} />
          <Route path="plates" element={<WhitelistPlatesPage />} />
          <Route
            path="tradelicenses"
            element={<WhitelistTradeLicensesPage />}
          />
        </Route>
        {/* Add other routes here */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
