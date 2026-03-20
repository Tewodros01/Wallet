import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { APP_ROUTES } from "../../config/routes";
import { useAppSession } from "../../hooks/useAppSession";
import Dashboard from "../../page/Dashboard";

interface GuardProps {
  children: ReactElement;
}

export function RequireAuth({ children }: GuardProps) {
  const location = useLocation();
  const { isAuthenticated } = useAppSession();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={APP_ROUTES.signin}
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  return children;
}

export function RequireAdmin({ children }: GuardProps) {
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useAppSession();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={APP_ROUTES.signin}
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  if (!isAdmin) {
    return <Navigate to={APP_ROUTES.dashboard} replace />;
  }

  return children;
}

export function DashboardEntryRoute() {
  const { isAuthenticated, needsOnboarding } = useAppSession();

  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.signin} replace />;
  }

  if (needsOnboarding) {
    return <Navigate to={APP_ROUTES.onboarding} replace />;
  }

  return <Dashboard />;
}

export function AppEntryRedirect() {
  const { isAuthenticated } = useAppSession();

  return (
    <Navigate
      to={isAuthenticated ? APP_ROUTES.dashboard : APP_ROUTES.signin}
      replace
    />
  );
}
