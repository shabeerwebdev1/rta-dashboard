import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import InspectionObstaclePage from "./pages/InspectionObstaclePage";
import PlatePage from "./pages/PlatePage";
import TradePage from "./pages/TradePage";
import WhitelistPage from "./pages/WhitelistPage"; 

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="inspectionobstacle" element={<InspectionObstaclePage />} />

        {/* Nested route for Whitelist */}
        <Route path="whitelist" element={<WhitelistPage />}>
          <Route path="plate" element={<PlatePage />} />
          <Route path="trade" element={<TradePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
