/**
 * Server-side entry point for SSG prerendering.
 *
 * This file is compiled by Vite's SSR mode and used by scripts/prerender.mjs
 * to render each route to a static HTML string — no browser, no Puppeteer needed.
 *
 * The render() function is called once per route during the build.
 */
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider, HelmetServerState } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import { CartProvider } from "./context/CartContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppRoutes from "./AppRoutes";

export async function render(url: string): Promise<{ html: string; head: string }> {
  const helmetContext: { helmet?: HelmetServerState } = {};
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Don't run any actual API queries during SSG — they'll run client-side after hydration
        enabled: false,
        retry: false,
      },
    },
  });

  const appHtml = renderToString(
    <HelmetProvider context={helmetContext}>
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          <TooltipProvider>
            <StaticRouter location={url}>
              <Suspense fallback={null}>
                <AppRoutes />
              </Suspense>
            </StaticRouter>
          </TooltipProvider>
        </CartProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );

  const { helmet } = helmetContext;
  const head = helmet
    ? [
        helmet.title?.toString(),
        helmet.meta?.toString(),
        helmet.link?.toString(),
        helmet.script?.toString(),
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return { html: appHtml, head };
}
