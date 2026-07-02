import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="container-page py-16 grid gap-12 md:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-md bg-primary">
              <span className="font-display font-extrabold text-primary-foreground">C</span>
            </div>
            <span className="font-display font-extrabold tracking-tight text-foreground">
              CENTRALINAS
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            Especialistas em eletrónica automóvel. O maior stock de centralinas
            da Europa para oficinas e profissionais.
          </p>
        </div>

        <div>
          <h4 className="mono-label mb-4">Navegação</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>
              <Link to="/catalogo" className="hover:text-primary transition-colors">
                Catálogo
              </Link>
            </li>
            <li>
              <Link to="/servicos" className="hover:text-primary transition-colors">
                Serviços Técnicos
              </Link>
            </li>
            <li>
              <Link to="/encomenda" className="hover:text-primary transition-colors">
                Acompanhar Encomenda
              </Link>
            </li>
            <li>
              <Link to="/sobre" className="hover:text-primary transition-colors">
                Sobre Nós
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mono-label mb-4">Serviços</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>Reparação de Centralinas</li>
            <li>Reprogramação de Motor</li>
            <li>Clonagem de Módulos</li>
            <li>Remoção de Imobilizador</li>
            <li>Diagnóstico Avançado</li>
          </ul>
        </div>

        <div>
          <h4 className="mono-label mb-4">Contactos</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-3">
              <Phone className="size-4 shrink-0 text-primary" />
              +351 220 000 000
            </li>
            <li className="flex items-center gap-3">
              <Mail className="size-4 shrink-0 text-primary" />
              geral@centralinas.pt
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="size-4 shrink-0 text-primary mt-0.5" />
              Zona Industrial Norte
              <br />
              Porto, Portugal
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="mono-label">© 2026 Centralinas — Tecnologia Automóvel</p>
          <div className="flex gap-6 mono-label">
            <a href="#" className="hover:text-primary transition-colors">
              Termos
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Privacidade
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
