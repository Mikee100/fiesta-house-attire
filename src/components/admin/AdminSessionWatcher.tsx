import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ADMIN_SESSION_EXPIRED_EVENT, logoutAdmin } from "@/lib/adminAuth";
import { toast } from "sonner";

const AdminSessionWatcher = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onSessionExpired = () => {
      const isAdminRoute = location.pathname.startsWith("/admin");
      const isLoginRoute = location.pathname.startsWith("/admin/login");
      if (!isAdminRoute || isLoginRoute) return;

      toast.error("Session expired. Please sign in again.");

      // Clear any lingering in-memory token and cookies before redirect.
      void logoutAdmin();
      const next = `${location.pathname}${location.search}${location.hash}`;
      navigate(`/admin/login?next=${encodeURIComponent(next)}`, { replace: true });
    };

    window.addEventListener(ADMIN_SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => {
      window.removeEventListener(ADMIN_SESSION_EXPIRED_EVENT, onSessionExpired);
    };
  }, [location.pathname, location.search, location.hash, navigate]);

  return null;
};

export default AdminSessionWatcher;
