import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "../../contexts/AuthContext";
import { FULL_PATHS } from "../../constants/paths";
import { getRequiredPermissionForPath } from "../../utils/accessRoutes";
import { type MenuPermission } from "../../utils/permissionUtils";

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredPermission?: MenuPermission;
  requiredAction?: "create" | "read" | "update" | "delete";
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredAction = "read",
}) => {
  const { isAuthenticated, isLoading, hasPermission, canAccessAny, validateToken } = useAuth();
  const location = useLocation();
  const inferredPermission = requiredPermission ?? getRequiredPermissionForPath(location.pathname);

  React.useEffect(() => {
    if (isAuthenticated) {
      validateToken();
    }
  }, [location.pathname, isAuthenticated, validateToken]);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // Not logged in → go to Splash (which will eventually send to SSO if needed)
  if (!isAuthenticated) {
    return <Navigate to={FULL_PATHS.SPLASH} replace />;
  }

  // Logged in but doesn’t have permission → go to Forbidden
  if (requiredPermission && !hasPermission(requiredPermission, requiredAction)) {
    return <Navigate to={FULL_PATHS.FORBIDDEN} replace />;
  }

  if (!requiredPermission && inferredPermission && !canAccessAny(inferredPermission)) {
    return <Navigate to={FULL_PATHS.FORBIDDEN} replace />;
  }

  // Otherwise → allow route
  return children;
};

export default ProtectedRoute;
