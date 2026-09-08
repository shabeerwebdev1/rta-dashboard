import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  canAccessAnyPermission,
  hasPermissionAccess,
  type MenuPermission,
  type PermissionAction,
} from "../utils/permissionUtils";

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
  tokenExpiry: string | null;
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
  hasPermission: (
    menuName: MenuPermission,
    permission: PermissionAction
  ) => boolean;
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

  const parseTokenExpiry = useCallback((expiry: string | null | undefined): number | null => {
    if (!expiry) return null;

    const parsedExpiry = Date.parse(expiry);
    return Number.isNaN(parsedExpiry) ? null : parsedExpiry;
  }, []);

  const isTokenExpired = useCallback(
    (expiry: string | null | undefined): boolean => {
      const expiryTimestamp = parseTokenExpiry(expiry);
      return expiryTimestamp === null || expiryTimestamp <= Date.now();
    },
    [parseTokenExpiry],
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

    window.location.href =
      "https://sso.kandaprojects.live/webapp/ui/common/login.aspx";
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("sTafteeshToken");
    const userDataStr = localStorage.getItem("userData");

    if (token && userDataStr) {
      try {
        const userData = JSON.parse(userDataStr) as UserData;
        const storedExpiry = localStorage.getItem("tokenExpiry") ?? userData.tokenExpiry;

        if (
          userData.sTafteeshToken === token &&
          storedExpiry &&
          !isTokenExpired(storedExpiry)
        ) {
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
  }, [isTokenExpired, logout]);

  const login = useCallback((userData: UserData) => {
    setUser(userData);
    localStorage.setItem("sTafteeshToken", userData.sTafteeshToken);
    localStorage.setItem("userData", JSON.stringify(userData));
    if (userData.tokenExpiry) {
      localStorage.setItem("tokenExpiry", userData.tokenExpiry);
    } else {
      localStorage.removeItem("tokenExpiry");
    }
    localStorage.setItem("userGUID", userData.userGUID ?? "");
    localStorage.setItem("roleGUID", userData.roleGUID ?? "");
    localStorage.setItem("rolePermissions", JSON.stringify(userData.rolePermissions ?? []));
    localStorage.setItem("displayNameEn", userData.displayNameEn ?? "");
    localStorage.setItem("displayNameAr", userData.displayNameAr ?? "");
    localStorage.setItem("userImage", userData.userImage ?? "");
  }, []);

  const validateToken = useCallback((): boolean => {
    const token = localStorage.getItem("sTafteeshToken");
    const userDataStr = localStorage.getItem("userData");

    if (!token || !userDataStr) {
      logout();
      return false;
    }

    try {
      const userData = JSON.parse(userDataStr) as UserData;
      const storedExpiry = localStorage.getItem("tokenExpiry") ?? userData.tokenExpiry;

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
  }, [isTokenExpired, logout]);

  const hasPermission = (
    menuName: MenuPermission,
    permission: PermissionAction
  ): boolean => hasPermissionAccess(user?.rolePermissions, menuName, permission);

  const hasRead = (menuName: MenuPermission): boolean => hasPermission(menuName, "read");

  const canAccessAny = (menuName: MenuPermission): boolean =>
    canAccessAnyPermission(user?.rolePermissions, menuName);

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
