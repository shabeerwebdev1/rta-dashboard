import React, {
  createContext,
  useContext,
  useState,
  useEffect,
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

  useEffect(() => {
    // Check for existing token on app load
    const token = localStorage.getItem("sTafteeshToken");
    const userDataStr = localStorage.getItem("userData");

    if (token && userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        setUser(userData);
      } catch (error) {
        console.error("Failed to parse user data:", error);
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: UserData) => {
    setUser(userData);
    localStorage.setItem("sTafteeshToken", userData.sTafteeshToken);
    localStorage.setItem("userData", JSON.stringify(userData));

    if (userData.tokenExpiry) {
      localStorage.setItem("tokenExpiry", userData.tokenExpiry);
    }

    // Store additional user info
    localStorage.setItem("displayNameEn", userData.displayNameEn ?? "");
    localStorage.setItem("displayNameAr", userData.displayNameAr ?? "");
    localStorage.setItem("userImage", userData.userImage ?? "");
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("sTafteeshToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("tokenExpiry");
    localStorage.removeItem("displayNameEn");
    localStorage.removeItem("displayNameAr");
    localStorage.removeItem("userImage");

    // Redirect to sTafteesh login
    window.location.href =
      "https://sso.kandaprojects.live/webapp/ui/common/login.aspx";
  };

  const validateToken = (): boolean => {
    const token = localStorage.getItem("sTafteeshToken");
    const userDataStr = localStorage.getItem("userData");

    if (!token || !userDataStr) {
      logout();
      return false;
    }

    try {
      JSON.parse(userDataStr); // just to validate JSON
      return true;
    } catch (error) {
      console.error("Error validating token:", error);
      logout();
      return false;
    }
  };

  const hasPermission = (
    menuName: MenuPermission,
    permission: PermissionAction
  ): boolean => hasPermissionAccess(user?.rolePermissions, menuName, permission);

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
