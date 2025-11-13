import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import PageLoader from "./components/common/PageLoader";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { PATHS, FULL_PATHS } from "./constants/paths";
import GeneralSearchPage from "./pages/GeneralSearchPage";

// Lazy-loaded Pages
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PermitsPage = lazy(() => import("./pages/PermitsPage"));
const WhitelistPlatesPage = lazy(() => import("./pages/WhitelistPlatesPage"));
const PledgesPage = lazy(() => import("./pages/PledgesPage"));
const InspectionObstaclesPage = lazy(() => import("./pages/InspectionObstaclesPage"));
const FinesPage = lazy(() => import("./pages/FinesPage"));
const ParkonicPage = lazy(() => import("./pages/ParkonicPage"));
const DisputeManagementPage = lazy(() => import("./pages/DisputeManagementPage"));
const SplashPage = lazy(() => import("./pages/SplashPage"));
const CreateShiftPlan = lazy(() => import("./pages/CreateShiftPlan"));
const AdhocShiftPlan = lazy(() => import("./pages/AdhocShiftPlan"));
const ShiftManagement = lazy(() => import("./pages/ShiftManagement"));
const RoleManagementPage = lazy(() => import("./pages/RoleManagementPage"));
const LeaveManagementPage = lazy(() => import("./pages/LeaveManagementPage"));
const ComingSoonPage = lazy(() => import("./pages/ComingSoonPage"));
const TradeLicenseInspectionPage = lazy(() => import("./pages/TradeLicenseInspectionPage"));
const TowingPage = lazy(() => import("./pages/TowingPage"));
const ParkonicLocationPage = lazy(() => import("./pages/ParkonicLocationPage"));
//const AnalyticsInsightsPage = lazy(() => import("./pages/AnalyticsInsightsPage"));
const VehicleInspectionsPage = lazy(() => import("./pages/VehicleInspectionsPage"));
const ParkingsInspectionsPage = lazy(() => import("./pages/ParkingsInspectionsPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));

const AppRoutes = () => (
  <Routes>
    <Route path={PATHS.SPLASH} element={<SplashPage />} />

    <Route path="/" element={<MainLayout />}>
      <Route
        element={
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        }
      >
        <Route index element={<Navigate to={FULL_PATHS.SPLASH} replace />} />

        <Route
          path={PATHS.DASHBOARD}
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={PATHS.PERMITS}
          element={
            <ProtectedRoute>
              <PermitsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={PATHS.FINES}
          element={
            <ProtectedRoute>
              <FinesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={PATHS.PARKONIC}
          element={
            <ProtectedRoute>
              <ParkonicPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={PATHS.DISPUTE}
          element={
            <ProtectedRoute>
              <DisputeManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={PATHS.GENERAL}
          element={
            <ProtectedRoute>
              <GeneralSearchPage />
            </ProtectedRoute>
          }
        />

        <Route path={PATHS.WHITELIST}>
          <Route index element={<Navigate to={PATHS.PLATES} replace />} />
          <Route
            path={PATHS.PLATES}
            element={
              <ProtectedRoute>
                <WhitelistPlatesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={PATHS.INSPECTIONS_OBSTACLES}
            element={
              <ProtectedRoute>
                <InspectionObstaclesPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path={PATHS.TRADE_LICENSE_INSPECTIONS}
          element={
            <ProtectedRoute>
              <TradeLicenseInspectionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={PATHS.FINES}
          element={
            <ProtectedRoute>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route path={PATHS.FINES_VEHICLES} element={<VehicleInspectionsPage />} />
          <Route path={PATHS.FINES_PARKINGS} element={<ParkingsInspectionsPage />} />
        </Route>

        <Route
          path={PATHS.PLEDGES}
          element={
            <ProtectedRoute>
              <PledgesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={PATHS.SHIFT_MANAGEMENT}
          element={
            <ProtectedRoute>
              <ShiftManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path={PATHS.CREATESHIFTPLAN}
          element={
            <ProtectedRoute>
              <CreateShiftPlan />
            </ProtectedRoute>
          }
        />
        <Route
          path={PATHS.ADHOCSHIFTPLAN}
          element={
            <ProtectedRoute>
              <AdhocShiftPlan />
            </ProtectedRoute>
          }
        />
        <Route
          path={PATHS.ROLE_MANAGEMENT}
          element={
            <ProtectedRoute>
              <RoleManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={PATHS.LEAVE_MANAGEMENT}
          element={
            <ProtectedRoute>
              <LeaveManagementPage />
            </ProtectedRoute>
          }
        />
        {/* <Route
          path={FULL_PATHS.ANALYTICS}
          element={
            <ProtectedRoute>
              <AnalyticsInsightsPage />
            </ProtectedRoute>
          }
        /> */}
        <Route
          path={FULL_PATHS.REPORTS}
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={PATHS.TOWING}
          element={
            <ProtectedRoute>
              <TowingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path={PATHS.PARKONIC_LOCATION}
          element={
            <ProtectedRoute>
              <ParkonicLocationPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<ComingSoonPage />} />
      </Route>
    </Route>
  </Routes>
);

export default AppRoutes;
