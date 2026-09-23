import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "auth-context";

interface UnauthenticatedRouteProps {
  redirectTo?: string;
}

export function UnauthenticatedRoute({
  redirectTo = "/",
}: UnauthenticatedRouteProps) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
