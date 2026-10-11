import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { EcuScanLoader } from "./components/site/ecu-scan-loader";
import { useT } from "./lib/i18n";

function PendingPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <EcuScanLoader label={useT().layout.loader} />
    </div>
  );
}

// Search params sempre como texto simples (sem JSON): mantém zeros à esquerda em
// referências (ex.: ?q=0281016000) e gera URLs limpos e indexáveis.
function parseSearch(searchStr: string): Record<string, string> {
  const params = new URLSearchParams(searchStr.startsWith("?") ? searchStr.slice(1) : searchStr);
  const out: Record<string, string> = {};
  params.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null || value === "" || value === false) continue;
    params.set(key, value === true ? "1" : String(value));
  }
  const str = params.toString();
  return str ? `?${str}` : "";
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPreload: "intent",
    // Loader só aparece se a navegação demorar (evita piscar em páginas rápidas)
    defaultPendingComponent: PendingPage,
    defaultPendingMs: 400,
    defaultPendingMinMs: 600,
    parseSearch,
    stringifySearch,
  });

  return router;
};
