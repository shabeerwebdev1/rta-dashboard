import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import PageLoader from "./components/common/PageLoader";
import { PATHS, FULL_PATHS } from "./constants/paths";

// --- Lazy-loaded Page Components ---
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PermitsPage = lazy(() => import("./pages/PermitsPage"));
const WhitelistPlatesPage = lazy(() => import("./pages/entity/WhitelistPlatesPage"));
const WhitelistTradeLicensesPage = lazy(() => import("./pages/entity/WhitelistTradeLicensesPage"));
const PledgesPage = lazy(() => import("./pages/entity/PledgesPage"));
const InspectionObstaclesPage = lazy(() => import("./pages/entity/InspectionObstaclesPage"));
const FinesPage = lazy(() => import("./pages/FinesPage"));
const ParkonicPage = lazy(() => import("./pages/ParkonicPage"));
const DisputeManagementPage = lazy(() => import("./pages/entity/DisputeManagementPage"));

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Correctly wrap the page routes in a Suspense-powered layout route */}
        <Route
          element={
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          }
        >
          <Route index element={<Navigate to={FULL_PATHS.DASHBOARD} replace />} />
          <Route path={PATHS.DASHBOARD} element={<DashboardPage />} />
          <Route path={PATHS.PERMITS} element={<PermitsPage />} />
          <Route path={PATHS.FINES} element={<FinesPage />} />
          <Route path={PATHS.PARKONIC} element={<ParkonicPage />} />
          <Route path={PATHS.DISPUTE} element={<DisputeManagementPage />} />

          <Route path={PATHS.WHITELIST}>
            <Route index element={<Navigate to={PATHS.PLATES} replace />} />
            <Route path={PATHS.PLATES} element={<WhitelistPlatesPage />} />
            <Route path={PATHS.TRADELICENSES} element={<WhitelistTradeLicensesPage />} />
          </Route>

          <Route path={PATHS.PLEDGES} element={<PledgesPage />} />
          <Route path={PATHS.INSPECTIONS} element={<InspectionObstaclesPage />} />

          <Route path="*" element={<Navigate to={FULL_PATHS.DASHBOARD} replace />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
