import { useAuth } from "../contexts/AuthContext";

export const usePermission = () => {
  const { hasPermission, canAccessAny } = useAuth();

  const canCreate = (menuName: string) => hasPermission(menuName, "create");

  const canRead = (menuName: string) => hasPermission(menuName, "read");

  const canEdit = (menuName: string) => hasPermission(menuName, "update");

  const canDelete = (menuName: string) => hasPermission(menuName, "delete");

  const hasAnyAccess = (menuName: string) => canAccessAny(menuName);

  return { canCreate, canRead, canEdit, canDelete, hasAnyAccess };
};
