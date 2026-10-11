import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useConsent } from "@/lib/consent";
import { useT } from "@/lib/i18n";

/** Aviso no primeiro acesso: "Aceitar" e "Rejeitar" com o mesmo destaque (orientação CNPD). */
export function CookieBanner() {
  const { ready, consent, save, openSettings, settingsOpen } = useConsent();
  const c = useT().layout.cookies;
  const show = ready && !consent && !settingsOpen;

  return (
    <AnimatePresence>
      {show && (
        <motion.section
          role="region"
          aria-label={c.bannerAria}
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-3xl rounded-xl border border-border bg-surface-elevated/95 p-4 shadow-2xl backdrop-blur sm:inset-x-6 sm:bottom-6 sm:p-5"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <Cookie className="hidden size-6 shrink-0 text-primary md:block" aria-hidden />
            <p className="flex-1 text-sm text-muted-foreground">
              {c.banner}{" "}
              <Link
                to="/cookies"
                className="font-semibold text-foreground underline-offset-2 hover:underline"
              >
                {c.policy}
              </Link>
            </p>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
              <Button
                variant="outline"
                className="font-bold"
                onClick={() => save({ analytics: false, marketing: false })}
              >
                {c.reject}
              </Button>
              <Button
                variant="outline"
                className="font-bold"
                onClick={() => save({ analytics: true, marketing: true })}
              >
                {c.accept}
              </Button>
              <Button
                variant="ghost"
                className="col-span-2 font-semibold sm:col-span-1"
                onClick={openSettings}
              >
                {c.customize}
              </Button>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

const CATEGORIES = [
  { id: "necessary", locked: true },
  { id: "analytics", locked: false },
  { id: "marketing", locked: false },
] as const;

/** Painel "Definições de cookies" — aberto pelo aviso, pelo rodapé ou pela política. */
export function CookieSettingsDialog() {
  const { consent, save, settingsOpen, closeSettings } = useConsent();
  const t = useT().layout.cookies;
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (settingsOpen) {
      setAnalytics(!!consent?.analytics);
      setMarketing(!!consent?.marketing);
    }
  }, [settingsOpen, consent]);

  const values = { analytics, marketing } as const;
  const setters = { analytics: setAnalytics, marketing: setMarketing } as const;

  return (
    <Dialog open={settingsOpen} onOpenChange={(o) => !o && closeSettings()}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.settings}</DialogTitle>
          <DialogDescription>{t.settingsIntro}</DialogDescription>
        </DialogHeader>
        <ul className="space-y-3">
          {CATEGORIES.map((c) => (
            <li key={c.id} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between gap-4">
                <label htmlFor={`consent-${c.id}`} className="text-sm font-bold">
                  {t.categories[c.id].title}
                </label>
                {c.locked ? (
                  <span className="text-xs font-semibold text-muted-foreground">{t.always}</span>
                ) : (
                  <Switch
                    id={`consent-${c.id}`}
                    checked={values[c.id]}
                    onCheckedChange={(v) => setters[c.id](v)}
                  />
                )}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {t.categories[c.id].description}
              </p>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            variant="outline"
            className="font-bold"
            onClick={() => save({ analytics: false, marketing: false })}
          >
            {t.rejectAll}
          </Button>
          <Button
            variant="outline"
            className="font-bold"
            onClick={() => save({ analytics: true, marketing: true })}
          >
            {t.acceptAll}
          </Button>
          <Button className="col-span-2 font-bold" onClick={() => save({ analytics, marketing })}>
            {t.save}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Botão para reabrir as definições (rodapé, política de cookies). */
export function CookieSettingsButton({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const { openSettings } = useConsent();
  const label = useT().layout.cookies.settings;
  return (
    <button type="button" onClick={openSettings} className={className}>
      {children ?? label}
    </button>
  );
}
