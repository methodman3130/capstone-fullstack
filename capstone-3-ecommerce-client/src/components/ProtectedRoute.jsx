import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './ui';

/**
 * Route guard.
 *
 * Note: this is a UX guard, not a security boundary. Anyone can edit
 * JavaScript in their browser. The REAL protection is the `protect`
 * middleware on the server - this just stops honest users from landing
 * on a page that would only fail with a 401 anyway.
 */
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid place-items-center py-24 text-slate-400">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // `state` remembers where they were headed, so login can send them back.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h2 className="text-lg font-semibold text-slate-900">Admin only</h2>
        <p className="mt-2 text-sm text-slate-600">
          Your account role is not permitted to perform this action.
        </p>
      </div>
    );
  }

  return children;
}
