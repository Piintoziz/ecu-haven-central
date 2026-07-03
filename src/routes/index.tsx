import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Cpu,
  Package,
  Search,
  ShieldCheck,
  Truck,
  Wrench,
  Copy,
  Key,
  Activity,
} from "lucide-react";
import { SearchBar } from "@/components/site/search-bar";
import { ProductCard } from "@/components/site/product-card";
import {
  categories,
  carBrands,
  products,
  services,
  testimonials,
} from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      {
        title:
          "Centralinas — O maior stock de centralinas da Europa | ECUs, ABS, Airbag",
      },
      {
        name: "description",
        content:
          "Encontra por referência OEM entre 250.000+ centralinas em stock. Venda, reparação e reprogramação com garantia de 12 meses.",
      },
    ],
  }),
});

const serviceIcons = {
  wrench: Wrench,
  cpu: Cpu,
  copy: Copy,
  key: Key,
  activity: Activity,
  truck: Truck,
} as const;

function HomePage() {
  const featured = products.slice(0, 3);

  return (
    <>
      {/* HERO */}
      <section className="relative border-b border-border bg-surface/30">
        <div className="container-page py-14 md:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 border-l-2 border-primary pl-3 py-1 text-primary mono-label mb-6">
              <span className="size-1.5 rounded-full bg-primary" />
              250.000+ referências em stock · Envio 24h
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.05] mb-5">
              Centralinas automóveis.{" "}
              <span className="text-primary">Referência OEM,</span> pronta a
              enviar.
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mb-8">
              Venda, reparação e reprogramação de ECUs, ABS, airbag, TCU e BCM
              para 60+ marcas. Testadas em bancada, garantia 12 meses.
            </p>
            <SearchBar />
          </div>
        </div>
      </section>


      {/* TRUST */}
      <section className="border-b border-border bg-surface/40">
        <div className="container-page py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "250.000+", label: "Referências em stock" },
            { value: "60+", label: "Marcas suportadas" },
            { value: "24/48h", label: "Entrega express" },
            { value: "12 meses", label: "Garantia certificada" },
          ].map((s) => (
            <div key={s.label} className="border-l-2 border-primary/40 pl-4">
              <div className="text-2xl md:text-3xl font-extrabold font-mono tracking-tight text-foreground">
                {s.value}
              </div>
              <div className="mono-label mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-14 md:py-18">
        <div className="container-page">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="mono-label text-primary mb-2">01 · Catálogo</div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
                Categorias técnicas
              </h2>
              <p className="text-muted-foreground mt-2 max-w-lg">
                Componentes eletrónicos para todos os sistemas do veículo.
              </p>
            </div>
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all"
            >
              Ver catálogo completo <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to="/catalogo"
                search={{ category: cat.id }}
                className="surface-card hover-lift p-6 group hover:border-primary/40"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="grid size-12 place-items-center rounded-lg bg-background border border-border group-hover:border-primary/40 transition-colors">
                    <span className="font-mono text-xs font-bold text-primary">
                      {cat.shortCode}
                    </span>
                  </div>
                  <span className="mono-label">
                    {cat.count.toLocaleString("pt-PT")}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {cat.name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {cat.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-14 md:py-18 bg-surface/40 border-y border-border">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="mono-label text-primary mb-2">02 · Processo</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
              Do diagnóstico à entrega
            </h2>
            <p className="text-muted-foreground mt-3">
              Rapidez e precisão técnica em quatro passos.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: Search,
                title: "Pesquisa por referência",
                desc: "Usa o número OEM da peça original para garantir 100% de compatibilidade.",
              },
              {
                icon: BadgeCheck,
                title: "Confirma compatibilidade",
                desc: "Validamos com base em marca, modelo, motor e ano.",
              },
              {
                icon: Package,
                title: "Encomenda simples",
                desc: "Adiciona ao carrinho e escolhe forma de envio e pagamento.",
              },
              {
                icon: Truck,
                title: "Recebe em 24/48h",
                desc: "Logística dedicada com acompanhamento de encomenda.",
              },
            ].map((step, i) => (
              <div key={step.title} className="relative">
                <div className="mono-label text-primary mb-4 opacity-70">
                  0{i + 1}
                </div>
                <step.icon className="size-6 text-primary mb-4" />
                <h4 className="font-bold text-foreground mb-2">{step.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="py-14 md:py-18">
        <div className="container-page">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="mono-label text-primary mb-2">03 · Stock</div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
                Referências em destaque
              </h2>
            </div>
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary"
            >
              Todas as referências <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-14 md:py-18 bg-surface/40 border-y border-border">
        <div className="container-page">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="mono-label text-primary mb-2">04 · Serviços</div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight mb-6">
                Engenharia eletrónica automóvel de elite.
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md">
                Reparação, reprogramação, clonagem e diagnóstico avançado feitos
                em laboratório próprio.
              </p>
              <Link to="/servicos">
                <Button size="lg" className="gap-2">
                  Ver todos os serviços <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {services.map((s) => {
                const Icon = serviceIcons[s.icon as keyof typeof serviceIcons];
                return (
                  <div key={s.id} className="surface-card p-5 hover-lift hover:border-primary/40">
                    <Icon className="size-5 text-primary mb-3" />
                    <h4 className="font-bold text-foreground mb-1">
                      {s.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {s.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-14 md:py-18">
        <div className="container-page">
          <div className="mono-label text-primary mb-2">05 · Clientes</div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-10">
            Quem trabalha connosco.
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="surface-card p-6">
                <ShieldCheck className="size-5 text-primary mb-4" />
                <p className="text-foreground leading-relaxed mb-6">
                  "{t.quote}"
                </p>
                <div>
                  <div className="font-bold text-foreground">{t.name}</div>
                  <div className="mono-label mt-1">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BRAND GRID */}
      <section className="py-16 border-t border-border bg-surface/30">
        <div className="container-page">
          <div className="mono-label text-center mb-8">
            Compatível com as principais marcas automóveis
          </div>
          <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4 opacity-60">
            {carBrands.map((b) => (
              <span
                key={b}
                className="font-display font-bold text-sm md:text-base tracking-tight text-foreground/70 hover:text-primary transition-colors uppercase"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
