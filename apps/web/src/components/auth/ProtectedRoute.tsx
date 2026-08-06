import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { UserRoleCode } from '@laps/shared';
import { Spinner } from '../feedback/Spinner';

export interface ProtectedRouteProps {
  allowedRoles?: UserRoleCode[];
  requiredPermission?: string;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  requiredPermission,
  children,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { can } = usePermissions();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <Spinner size="lg" className="text-indigo-500 mx-auto" />
          <p className="text-sm font-medium text-slate-400 mt-3">
            Verifying secure session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirectTo=${redirectTo}`} replace />;
  }

  if (user.role !== 'SUPER_ADMIN') {
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/portal/unauthorized" replace />;
      }
    }

    if (requiredPermission && !can(requiredPermission)) {
      return <Navigate to="/portal/unauthorized" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};
