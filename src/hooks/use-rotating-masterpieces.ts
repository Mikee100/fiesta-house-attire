import { useEffect, useState } from "react";
import { AssetRecord, fetchRotatingMasterpieces } from "@/lib/api";

const ROTATION_MS = 4 * 60 * 60 * 1000;
const NAIROBI_OFFSET_MS = 3 * 60 * 60 * 1000;
const getNairobiSlot = () => Math.floor((Date.now() + NAIROBI_OFFSET_MS) / ROTATION_MS);

export const useRotatingMasterpieces = () => {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let inFlight = false;
    let loadedSlot: number | null = null;
    let timer: ReturnType<typeof setTimeout>;

    const refresh = async () => {
      const slot = getNairobiSlot();
      if (inFlight || slot === loadedSlot) return;
      inFlight = true;
      try {
        const images = await fetchRotatingMasterpieces();
        if (active) {
          setAssets(images);
          loadedSlot = slot;
        }
      } catch (error) {
        console.error("Failed to refresh rotating masterpieces:", error);
      } finally {
        inFlight = false;
        if (active) setLoading(false);
      }
    };

    const scheduleRotation = () => {
      const delay = (getNairobiSlot() + 1) * ROTATION_MS - NAIROBI_OFFSET_MS - Date.now();
      timer = setTimeout(() => {
        void refresh();
        scheduleRotation();
      }, delay);
    };

    const onResume = () => {
      if (document.visibilityState === "visible") void refresh();
    };

    void refresh();
    scheduleRotation();
    window.addEventListener("focus", onResume);
    document.addEventListener("visibilitychange", onResume);
    return () => {
      active = false;
      clearTimeout(timer);
      window.removeEventListener("focus", onResume);
      document.removeEventListener("visibilitychange", onResume);
    };
  }, []);

  return { assets, loading };
};