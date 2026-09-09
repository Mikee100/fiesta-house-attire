import { hydrateRoot, createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootEl = document.getElementById("root")!;

const shouldLogHydrationDiagnostics = () => {
  if (import.meta.env.DEV) return true;

  try {
    return window.sessionStorage.getItem("fh_debug_hydration") === "1";
  } catch {
    return false;
  }
};

// If the page was pre-rendered by SSG, hydrate (preserves the server HTML).
// Otherwise (dev mode or no SSG), do a regular client-side render.
if (rootEl.innerHTML.trim().length > 0) {
  hydrateRoot(rootEl, <App />, {
    onRecoverableError(error, errorInfo) {
      if (shouldLogHydrationDiagnostics()) {
        console.error("Recoverable React hydration error", {
          error,
          componentStack: errorInfo.componentStack,
        });
      }
    },
  });
} else {
  createRoot(rootEl).render(<App />);
}
