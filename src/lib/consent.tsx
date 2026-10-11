import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// Consentimento de cookies (RGPD + Lei 41/2004, art. 5.º). Hoje o site só usa
// armazenamento essencial; as categorias "analytics" e "marketing" existem para
// que qualquer script futuro (ex.: estatísticas) só carregue depois de
// consentAllows("analytics") === true.

export type ConsentCategory = "analytics" | "marketing";

export type ConsentState = {
  version: 1;
  /** ISO — data da decisão. Consentimento expira ao fim de 12 meses. */
  decidedAt: string;
  analytics: boolean;
  marketing: boolean;
};

const STORAGE_KEY = "centralinas.consent.v1";
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

type ConsentContextValue = {
  ready: boolean;
  /** null = ainda não decidiu (ou expirou) → mostrar o aviso */
  consent: ConsentState | null;
  allows: (c: ConsentCategory) => boolean;
  save: (choice: Pick<ConsentState, "analytics" | "marketing">) => void;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

function read(): ConsentState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as ConsentState;
    if (v?.version !== 1 || typeof v.decidedAt !== "string") return null;
    if (Date.now() - new Date(v.decidedAt).getTime() > MAX_AGE_MS) return null;
    return {
      version: 1,
      decidedAt: v.decidedAt,
      analytics: !!v.analytics,
      marketing: !!v.marketing,
    };
  } catch {
    return null;
  }
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setConsent(read());
    setReady(true);
  }, []);

  const save = useCallback((choice: Pick<ConsentState, "analytics" | "marketing">) => {
    const next: ConsentState = { version: 1, decidedAt: new Date().toISOString(), ...choice };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // modo privado / armazenamento bloqueado: a escolha vale só para esta visita
    }
    setConsent(next);
    setSettingsOpen(false);
  }, []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      ready,
      consent,
      allows: (c) => !!consent?.[c],
      save,
      settingsOpen,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
    }),
    [ready, consent, save, settingsOpen],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent() fora do ConsentProvider");
  return ctx;
}
