import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import PageLoader from "./components/common/PageLoader";
import { PATHS, FULL_PATHS } from "./constants/paths";
import GeneralSearchPage from "./pages/GeneralSearchPage";

// --- Lazy-loaded Page Components ---
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PermitsPage = lazy(() => import("./pages/PermitsPage"));
const WhitelistPlatesPage = lazy(() => import("./pages/WhitelistPlatesPage"));
const WhitelistTradeLicensesPage = lazy(() => import("./pages/WhitelistTradeLicensesPage"));
const PledgesPage = lazy(() => import("./pages/PledgesPage"));
const InspectionObstaclesPage = lazy(() => import("./pages/InspectionObstaclesPage"));
const FinesPage = lazy(() => import("./pages/FinesPage"));
const ParkonicPage = lazy(() => import("./pages/ParkonicPage"));
const DisputeManagementPage = lazy(() => import("./pages/DisputeManagementPage"));
const UserZoneLinking = lazy(() => import("./pages/UserZoneLinking"));
const LoginPage = lazy(() => import("./pages/LoginPage")); // 👈 added
const SplashPage = lazy(() => import("./pages/SplashPage"));
const ShiftPlanning = lazy(() => import("./pages/ShiftPlanning"));


const AppRoutes = () => {
  return (
    <Routes>
      {/* --- Public Routes (Login) --- */}
      <Route path={PATHS.LOGIN} element={<LoginPage />} />
      <Route path={PATHS.SPLASH} element={<SplashPage />} />

      {/* --- Protected Routes (Main Layout) --- */}
      <Route path="/" element={<MainLayout />}>
        <Route
          element={
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          }
        >
          {/* At root, redirect to login */}
          <Route index element={<Navigate to={FULL_PATHS.LOGIN} replace />} />

          <Route path={PATHS.DASHBOARD} element={<DashboardPage />} />
          <Route path={PATHS.PERMITS} element={<PermitsPage />} />
          <Route path={PATHS.FINES} element={<FinesPage />} />
          <Route path={PATHS.PARKONIC} element={<ParkonicPage />} />
          <Route path={PATHS.DISPUTE} element={<DisputeManagementPage />} />
          <Route path={PATHS.GENERAL} element={<GeneralSearchPage />} />

          <Route path={PATHS.WHITELIST}>
            <Route index element={<Navigate to={PATHS.PLATES} replace />} />
            <Route path={PATHS.PLATES} element={<WhitelistPlatesPage />} />
            <Route path={PATHS.TRADELICENSES} element={<WhitelistTradeLicensesPage />} />
          </Route>

          <Route path={PATHS.PLEDGES} element={<PledgesPage />} />
          <Route path={PATHS.INSPECTIONS} element={<InspectionObstaclesPage />} />
          <Route path={PATHS.INSPECTOR_MANAGEMENT} element={<UserZoneLinking />} />
          <Route path={PATHS.SHIFTPLANNING} element={<ShiftPlanning />} />


          {/* Fallback */}
          <Route path="*" element={<Navigate to={FULL_PATHS.LOGIN} replace />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;