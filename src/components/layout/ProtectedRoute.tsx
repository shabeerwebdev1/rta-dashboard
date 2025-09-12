import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import { FULL_PATHS } from '../../constants/paths';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredPermission?: string;
  requiredAction?: 'create' | 'read' | 'update' | 'delete';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredAction = 'read',
}) => {
  const { isAuthenticated, isLoading, hasPermission, validateToken } = useAuth();
  const location = useLocation();

  React.useEffect(() => {
    if (isAuthenticated) validateToken();
  }, [location.pathname, isAuthenticated, validateToken]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to={FULL_PATHS.SPLASH} replace />;

  if (requiredPermission && !hasPermission(requiredPermission, requiredAction)) {
    return <Navigate to="/403" replace />;
  }

  return children;
};

export default ProtectedRoute;
