import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Location } from "react-router-dom";
import authHooks from "@/hooks/useAuth";

interface Props {
  children: ReactNode;
  requireAuth: boolean;
}

const ProtectedRoute = ({ children, requireAuth }: Props) => {
  const { isAuthenticated } = authHooks.useUser();
  const location = useLocation();

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Already logged in but trying to access login/register → Original page or Home
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";
  if (isAuthPage && isAuthenticated) {
    const state = location.state as { from?: Location };
    const from = state?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
