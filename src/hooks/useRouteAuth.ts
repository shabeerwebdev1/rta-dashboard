import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FULL_PATHS } from "../constants/paths";
import { canAccessPath } from "../utils/accessRoutes";

export const useRouteAuth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { validateToken, isAuthenticated, logout, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      logout();
      return;
    }

    if (!validateToken()) {
      return;
    }

    if (!canAccessPath(user?.rolePermissions ?? [], location.pathname)) {
      navigate(FULL_PATHS.FORBIDDEN, { replace: true });
    }
  }, [location.pathname, isAuthenticated, logout, navigate, user?.rolePermissions, validateToken]);
};
