import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Map of routes → menu names in rolePermissions
const routePermissions: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/permits": "Permit",
  "/fines": "Inspection",
  "/parkonic": "trParkonics",
  "/dispute": "Dispute",
  "/pledges": "Pledge",
  "/createshiftplan": "CreateShift",
  "/adhocshiftplan": "AdhocShift",
  "/shiftmanagement": "ShiftManagement",
  "/rolemanagement": "RolePermission",
  "/leave-management": "Leave",
  // add other routes as needed
};

export const useRouteAuth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { validateToken, isAuthenticated, canAccessAny, logout } = useAuth();

  useEffect(() => {
    const checkAuth = () => {
      // 1) Login check
      if (!isAuthenticated) {
        logout(); // will redirect to SSO
        return;
      }

      // 2) Validate token
      const valid = validateToken();
      if (!valid) {
        logout();
        return;
      }

      // 3) Role → route check
      const path = location.pathname.toLowerCase();
      const matchedRoute = Object.keys(routePermissions).find((route) =>
        path.startsWith(route.toLowerCase())
      );

      if (matchedRoute) {
        const requiredMenu = routePermissions[matchedRoute];
        if (!canAccessAny(requiredMenu)) {
          navigate("/403", { replace: true }); // Forbidden page
        }
      }
    };

    checkAuth();
  }, [location.pathname, isAuthenticated, validateToken, canAccessAny, logout, navigate]);
};
