import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  canAccessAnyPermission,
  hasPermissionAccess,
  type MenuPermission,
  type PermissionAction,
} from "../utils/permissionUtils";
import { EXTERNAL_LOGIN_URL } from "../config/envConfig";

interface RolePermission {
  id: number;
  roleManagementCode: string;
  menuName: string;
  roleGUID: string;
  canCreate: number;
  canRead: number;
  canUpdate: number;
  canDelete: number;
  isActive: boolean;
}

interface UserData {
  logonName: string;
  displayNameEn: string;
  displayNameAr: string;
  userImage: string;
  userGUID: string;
  roleGUID: string;
  sTafteeshToken: string;
  tokenExpiry: string | number | null;
  rolePermissions: RolePermission[];
  departmentId?: string;
  empNumber?: string;
}

interface AuthContextType {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: UserData) => void;
  logout: () => void;
  hasPermission: (menuName: MenuPermission, permission: PermissionAction) => boolean;
  validateToken: () => boolean;
  canAccessAny: (menuName: MenuPermission) => boolean;
  hasRead: (menuName: MenuPermission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const parseTokenExpiry = useCallback((expiry: string | number | null | undefined): number | null => {
    if (!expiry) return null;

    if (typeof expiry === "number") {
      return expiry < 1_000_000_000_000 ? expiry * 1000 : expiry;
    }

    if (/^\d+$/.test(expiry)) {
      const numericExpiry = Number(expiry);
      return numericExpiry < 1_000_000_000_000 ? numericExpiry * 1000 : numericExpiry;
    }

    const parsedExpiry = Date.parse(expiry);
    return Number.isNaN(parsedExpiry) ? null : parsedExpiry;
  }, []);

  const isTokenExpired = useCallback(
    (expiry: string | number | null | undefined): boolean => {
      const expiryTimestamp = parseTokenExpiry(expiry);
      return expiryTimestamp === null || expiryTimestamp <= Date.now();
    },
    [parseTokenExpiry],
  );

  const getTokenExpiry = useCallback(
    (token: string, explicitExpiry: string | number | null | undefined): string | number | null => {
      if (explicitExpiry) return explicitExpiry;

      try {
        const payload = token.split(".")[1];
        if (!payload) return null;
        const base64Payload = payload.replace(/-/g, "+").replace(/_/g, "/");
        const paddedPayload = base64Payload.padEnd(Math.ceil(base64Payload.length / 4) * 4, "=");
        const decodedPayload = JSON.parse(atob(paddedPayload)) as {
          exp?: number;
        };
        return decodedPayload.exp ?? null;
      } catch {
        return null;
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("sTafteeshToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("tokenExpiry");
    localStorage.removeItem("userGUID");
    localStorage.removeItem("roleGUID");
    localStorage.removeItem("rolePermissions");
    localStorage.removeItem("displayNameEn");
    localStorage.removeItem("displayNameAr");
    localStorage.removeItem("userImage");

    window.location.href = EXTERNAL_LOGIN_URL;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("sTafteeshToken");
    const userDataStr = localStorage.getItem("userData");

    if (token && userDataStr) {
      try {
        const userData = JSON.parse(userDataStr) as UserData;
        const storedExpiry = getTokenExpiry(token, localStorage.getItem("tokenExpiry") ?? userData.tokenExpiry);

        if (userData.sTafteeshToken === token && storedExpiry && !isTokenExpired(storedExpiry)) {
          setUser(userData);
        } else {
          logout();
        }
      } catch (error) {
        console.error("Failed to parse user data:", error);
        logout();
      }
    }
    setIsLoading(false);
  }, [getTokenExpiry, isTokenExpired, logout]);

  useEffect(() => {
    if (!user) return;

    const expiry = getTokenExpiry(user.sTafteeshToken, user.tokenExpiry);
    const expiryTimestamp = parseTokenExpiry(expiry);
    if (expiryTimestamp === null) {
      logout();
      return;
    }

    const remainingMilliseconds = expiryTimestamp - Date.now();
    if (remainingMilliseconds <= 0) {
      logout();
      return;
    }

    const timeoutId = window.setTimeout(logout, remainingMilliseconds);
    return () => window.clearTimeout(timeoutId);
  }, [getTokenExpiry, logout, parseTokenExpiry, user]);

  const login = useCallback(
    (userData: UserData) => {
      setUser(userData);
      localStorage.setItem("sTafteeshToken", userData.sTafteeshToken);
      localStorage.setItem("userData", JSON.stringify(userData));
      const tokenExpiry = getTokenExpiry(userData.sTafteeshToken, userData.tokenExpiry);
      if (tokenExpiry) {
        localStorage.setItem("tokenExpiry", String(tokenExpiry));
      } else {
        localStorage.removeItem("tokenExpiry");
      }
      localStorage.setItem("userGUID", userData.userGUID ?? "");
      localStorage.setItem("roleGUID", userData.roleGUID ?? "");
      localStorage.setItem("rolePermissions", JSON.stringify(userData.rolePermissions ?? []));
      localStorage.setItem("displayNameEn", userData.displayNameEn ?? "");
      localStorage.setItem("displayNameAr", userData.displayNameAr ?? "");
      localStorage.setItem("userImage", userData.userImage ?? "");
    },
    [getTokenExpiry],
  );

  const validateToken = useCallback((): boolean => {
    const token = localStorage.getItem("sTafteeshToken");
    const userDataStr = localStorage.getItem("userData");

    if (!token || !userDataStr) {
      logout();
      return false;
    }

    try {
      const userData = JSON.parse(userDataStr) as UserData;
      const storedExpiry = getTokenExpiry(token, localStorage.getItem("tokenExpiry") ?? userData.tokenExpiry);

      if (userData.sTafteeshToken !== token || !storedExpiry || isTokenExpired(storedExpiry)) {
        logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error validating token:", error);
      logout();
      return false;
    }
  }, [getTokenExpiry, isTokenExpired, logout]);

  const hasPermission = (menuName: MenuPermission, permission: PermissionAction): boolean =>
    hasPermissionAccess(user?.rolePermissions, menuName, permission);

  const hasRead = (menuName: MenuPermission): boolean => hasPermission(menuName, "read");

  const canAccessAny = (menuName: MenuPermission): boolean => canAccessAnyPermission(user?.rolePermissions, menuName);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission,
    validateToken,
    canAccessAny,
    hasRead,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
