import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const useRouteAuth = () => {
  const location = useLocation();
  const { validateToken, isAuthenticated } = useAuth();

  useEffect(() => {
    // Run authentication check on every route change
    if (isAuthenticated) {
      const isValid = validateToken();
      
      if (!isValid) {
        // Token is invalid, redirect handled by validateToken
        return;
      }
    }
  }, [location.pathname, isAuthenticated, validateToken]);
};