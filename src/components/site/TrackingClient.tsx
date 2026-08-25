import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initTracking, trackPageView } from "@/lib/tracking";

const TrackingClient = () => {
  const location = useLocation();

  useEffect(() => {
    initTracking();
  }, []);

  useEffect(() => {
    trackPageView();
  }, [location.pathname, location.search]);

  return null;
};

export default TrackingClient;
