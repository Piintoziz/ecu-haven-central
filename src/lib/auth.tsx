import { createClient, type Session, type SupabaseClient, type User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { SITE_URL, SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

// Sessão do utilizador (cliente e backoffice). Só existe no browser: as páginas
// que dependem dela (/conta, /admin) são renderizadas sem SSR. Tudo o que o
// utilizador pode ler/escrever é decidido pelas políticas RLS no Postgres —
// os papéis aqui servem apenas para mostrar ou esconder interface.

export type AppRole = "admin" | "staff" | "customer";

let browserClient: SupabaseClient | null = null;

/** Cliente autenticado (chave publicável + JWT do utilizador). Só no browser. */
export function getAuthClient(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error("getAuthClient() só pode ser usado no browser");
  }
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase não configurado: define VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env",
    );
  }
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
        storageKey: "centralinas.auth",
      },
    });
  }
  return browserClient;
}

/** Só aceita caminhos internos ("/conta"), nunca URLs externos ou "//dominio". */
export function safeRedirect(value: unknown, fallback = "/conta"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value.slice(0, 200);
}

export function authRedirectUrl(path: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : SITE_URL;
  return `${origin}${path}`;
}

/** Mensagens do Supabase Auth em português (sem revelar se o email existe). */
export function authErrorMessage(message: string | undefined): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("invalid login credentials")) return "Email ou palavra-passe incorretos.";
  if (m.includes("email not confirmed"))
    return "Confirme o seu email antes de entrar — enviámos-lhe um link.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Já existe uma conta com este email. Entre ou recupere a palavra-passe.";
  if (m.includes("password should be") || m.includes("weak password"))
    return "Palavra-passe demasiado fraca. Use pelo menos 8 caracteres, com letras e números.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Demasiadas tentativas. Aguarde alguns minutos e tente novamente.";
  if (m.includes("same password")) return "A nova palavra-passe tem de ser diferente da anterior.";
  return "Não foi possível concluir o pedido. Tente novamente.";
}

type AuthContextValue = {
  ready: boolean;
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  isStaff: boolean;
  isAdmin: boolean;
  /** true depois de abrir o link de recuperação de palavra-passe */
  recovering: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [recovering, setRecovering] = useState(false);
  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReady(true);
      return;
    }
    const supabase = getAuthClient();
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (!data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      if (event === "SIGNED_OUT") {
        setRoles([]);
        setRecovering(false);
        setReady(true);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Papéis: a RLS só deixa cada utilizador ler os seus.
  useEffect(() => {
    if (!userId) return;
    let active = true;
    setReady(false);
    void getAuthClient()
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (!active) return;
        setRoles(((data ?? []) as { role: AppRole }[]).map((r) => r.role));
        setReady(true);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      session,
      user: session?.user ?? null,
      roles,
      isStaff: roles.includes("admin") || roles.includes("staff"),
      isAdmin: roles.includes("admin"),
      recovering,
      signOut: async () => {
        await getAuthClient().auth.signOut();
      },
    }),
    [ready, session, roles, recovering],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() fora do AuthProvider");
  return ctx;
}
