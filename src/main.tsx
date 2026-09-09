import { hydrateRoot, createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootEl = document.getElementById("root")!;

// If the page was pre-rendered by SSG, hydrate (preserves the server HTML).
// Otherwise (dev mode or no SSG), do a regular client-side render.
if (rootEl.innerHTML.trim().length > 0) {
  hydrateRoot(rootEl, <App />);
} else {
  createRoot(rootEl).render(<App />);
}
