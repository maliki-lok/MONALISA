import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];
  requireAll?: boolean; // If true, requires ALL permissions/roles. Default: any
}

export function ProtectedRoute({
  children,
  permission,
  permissions,
  role,
  roles,
  requireAll = false,
}: ProtectedRouteProps) {
  const { user, loading, hasPermission, hasRole, hasAnyPermission, hasAnyRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check single role
  if (role && !hasRole(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    if (requireAll) {
      const hasAll = permissions.every(p => hasPermission(p));
      if (!hasAll) {
        return <Navigate to="/unauthorized" replace />;
      }
    } else {
      if (!hasAnyPermission(permissions)) {
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }

  // Check multiple roles
  if (roles && roles.length > 0) {
    if (requireAll) {
      const hasAll = roles.every(r => hasRole(r));
      if (!hasAll) {
        return <Navigate to="/unauthorized" replace />;
      }
    } else {
      if (!hasAnyRole(roles)) {
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }

  return <>{children}</>;
}
