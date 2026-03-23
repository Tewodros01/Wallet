import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { APP_ROUTES } from "../../../config/routes";
import { useAuthSession } from "../../features/auth";
import { Dashboard } from "../../features/dashboard";

interface GuardProps {
  children: ReactElement;
}

export function RequireAuth({ children }: GuardProps) {
  const location = useLocation();
  const { isAuthenticated } = useAuthSession();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={APP_ROUTES.signin}
        replace
        state={{
          from: `${location.pathname}${location.search}${location.hash}`,
        }}
      />
    );
  }

  return children;
}

export function RequireAdmin({ children }: GuardProps) {
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useAuthSession();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={APP_ROUTES.signin}
        replace
        state={{
          from: `${location.pathname}${location.search}${location.hash}`,
        }}
      />
    );
  }

  if (!isAdmin) {
    return <Navigate to={APP_ROUTES.dashboard} replace />;
  }

  return children;
}

export function DashboardEntryRoute() {
  const { isAuthenticated, needsOnboarding } = useAuthSession();

  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.signin} replace />;
  }

  if (needsOnboarding) {
    return <Navigate to={APP_ROUTES.onboarding} replace />;
  }

  return <Dashboard />;
}

export function AppEntryRedirect() {
  const { isAuthenticated } = useAuthSession();

  return (
    <Navigate
      to={isAuthenticated ? APP_ROUTES.dashboard : APP_ROUTES.signin}
      replace
    />
  );
}
