import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAdminAuthenticated, refreshAdminSession } from "@/lib/adminAuth";

interface ProtectedAdminRouteProps {
  children: ReactNode;
}

const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;
    const AUTH_CHECK_TIMEOUT_MS = 5000;

    const checkAuth = async () => {
      if (isAdminAuthenticated()) {
        if (mounted) {
          setIsAuthenticated(true);
          setIsChecking(false);
        }
        return;
      }

      const restored = await Promise.race<boolean>([
        refreshAdminSession(),
        new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(false), AUTH_CHECK_TIMEOUT_MS);
        }),
      ]);

      if (mounted) {
        setIsAuthenticated(restored);
        setIsChecking(false);
      }
    };

    checkAuth();
    return () => {
      mounted = false;
    };
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-slate-500">
        Checking admin session...
      </div>
    );
  }

  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/admin/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
