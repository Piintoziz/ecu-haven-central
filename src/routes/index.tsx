import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Cpu,
  Package,
  Search,
  Truck,
  Wrench,
  Copy,
  Key,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { SearchBar } from "@/components/site/search-bar";
import { ProductCard } from "@/components/site/product-card";
import { Reveal, Stagger, StaggerItem } from "@/components/site/reveal";
import { CountUp } from "@/components/site/count-up";
import {
  categories,
  carBrands,
  products,
  services,
  testimonials,
} from "@/lib/mock-data";
import { images, categoryImage, serviceImage } from "@/lib/images";
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
    links: [
      {
        rel: "preload",
        as: "image",
        href: images.heroEngine,
        fetchpriority: "high",
      } as unknown as { rel: string },
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
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <>
      {/* HERO */}
      <section
        ref={heroRef}
        className="relative border-b border-border overflow-hidden isolate"
      >
        <motion.div
          style={{ y: heroY, scale: heroScale }}
          className="absolute inset-0 -z-10 bg-background"
        >
          {/* Fallback poster while video loads */}
          <img
            src={images.heroEngine}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover img-treated-warm"
          />
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster={images.heroEngine}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover img-treated-warm"
          >
            <source
              src="https://cdn.pixabay.com/video/2022/10/12/134876-759790785_large.mp4"
              type="video/mp4"
            />
            <source
              src="https://cdn.pixabay.com/video/2020/04/12/35443-410630903_large.mp4"
              type="video/mp4"
            />
          </video>
          {/* Dark overlay for text contrast */}
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </motion.div>

        <div className="container-page py-20 md:py-28 lg:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 border-l-2 border-primary pl-3 py-1 text-primary mono-label mb-6">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
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
          </motion.div>
        </div>
      </section>

      {/* TRUST */}
      <section className="border-b border-border bg-surface/40">
        <div className="container-page py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: 250000, suffix: "+", label: "Referências em stock" },
            { value: 60, suffix: "+", label: "Marcas suportadas" },
            { value: 24, suffix: "h", label: "Entrega express" },
            { value: 12, suffix: " meses", label: "Garantia certificada" },
          ].map((s, i) => (
            <Reveal
              key={s.label}
              delay={i * 0.05}
              className="border-l-2 border-primary/40 pl-4"
            >
              <div className="text-2xl md:text-3xl font-extrabold font-mono tracking-tight text-foreground">
                <CountUp end={s.value} suffix={s.suffix} />
              </div>
              <div className="mono-label mt-1">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-14 md:py-16">
        <div className="container-page">
          <Reveal className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
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
          </Reveal>

          <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => (
              <StaggerItem key={cat.id}>
                <Link
                  to="/catalogo"
                  search={{ category: cat.id }}
                  className="group relative surface-card overflow-hidden block hover:border-primary/50 transition-colors"
                >
                  <div className="absolute inset-0 opacity-15 group-hover:opacity-30 transition-opacity">
                    <img
                      src={categoryImage[cat.id]}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover img-treated"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-surface via-surface/70 to-transparent" />
                  </div>
                  <div className="relative p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="grid size-12 place-items-center rounded-lg bg-background/80 backdrop-blur border border-border group-hover:border-primary/50 transition-colors">
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
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-14 md:py-16 bg-surface/40 border-y border-border">
        <div className="container-page">
          <Reveal className="text-center max-w-2xl mx-auto mb-12">
            <div className="mono-label text-primary mb-2">02 · Processo</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
              Do diagnóstico à entrega
            </h2>
            <p className="text-muted-foreground mt-3">
              Rapidez e precisão técnica em quatro passos.
            </p>
          </Reveal>

          <Stagger className="grid md:grid-cols-4 gap-8">
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
              <StaggerItem key={step.title}>
                <div className="mono-label text-primary mb-4 opacity-70">
                  0{i + 1}
                </div>
                <step.icon className="size-6 text-primary mb-4" />
                <h4 className="font-bold text-foreground mb-2">{step.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="py-14 md:py-16">
        <div className="container-page">
          <Reveal className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
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
          </Reveal>

          <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((p) => (
              <StaggerItem key={p.id}>
                <ProductCard product={p} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-14 md:py-16 bg-surface/40 border-y border-border">
        <div className="container-page">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <Reveal>
              <div className="mono-label text-primary mb-2">04 · Serviços</div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight mb-4">
                Não temos a peça? Reparamos a tua.
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Laboratório próprio para reparação, reprogramação, clonagem e
                virginização. Recebemos, testamos e devolvemos em 3–5 dias úteis.
              </p>
              <Link to="/servicos">
                <Button size="lg" className="gap-2">
                  Ver todos os serviços <ArrowRight className="size-4" />
                </Button>
              </Link>
            </Reveal>

            <Stagger className="grid sm:grid-cols-2 gap-4">
              {services.map((s) => {
                const Icon = serviceIcons[s.icon as keyof typeof serviceIcons];
                const img = serviceImage[s.id];
                return (
                  <StaggerItem key={s.id}>
                    <div className="group relative surface-card overflow-hidden hover:border-primary/50 transition-colors h-full">
                      {img && (
                        <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                          <img
                            src={img}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover img-treated"
                          />
                        </div>
                      )}
                      <div className="relative p-5">
                        <Icon className="size-5 text-primary mb-3" />
                        <h4 className="font-bold text-foreground mb-1">
                          {s.title}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                          {s.description}
                        </p>
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-14 md:py-16">
        <div className="container-page">
          <Reveal>
            <div className="mono-label text-primary mb-2">05 · Clientes</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-10">
              Quem trabalha connosco.
            </h2>
          </Reveal>
          <Stagger className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <StaggerItem key={t.name}>
                <div className="surface-card p-6 h-full">
                  <ShieldCheck className="size-5 text-primary mb-4" />
                  <p className="text-foreground leading-relaxed mb-6">
                    "{t.quote}"
                  </p>
                  <div>
                    <div className="font-bold text-foreground">{t.name}</div>
                    <div className="mono-label mt-1">{t.role}</div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
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
