import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import PermitsPage from "./pages/PermitsPage";
import WhitelistPlatesPage from "./pages/entity/WhitelistPlatesPage";
import WhitelistTradeLicensesPage from "./pages/entity/WhitelistTradeLicensesPage";
import PledgesPage from "./pages/entity/PledgesPage";
import InspectionObstaclesPage from "./pages/entity/InspectionObstaclesPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="permits" element={<PermitsPage />} />

        <Route path="whitelist">
          <Route index element={<Navigate to="plates" replace />} />

          <Route path="plates" element={<WhitelistPlatesPage />} />
          <Route
            path="tradelicenses"
            element={<WhitelistTradeLicensesPage />}
          />
        </Route>

        <Route path="pledges" element={<PledgesPage />} />
        <Route path="inspections" element={<InspectionObstaclesPage />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
