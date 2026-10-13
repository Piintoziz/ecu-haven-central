/**
 * Animação "a ir para o carrinho": uma miniatura sai do botão e voa em arco até
 * ao ícone do carrinho no cabeçalho ([data-cart-target]), que dá um pequeno salto.
 * Usa a fotografia do produto quando existe (cartão/ficha), senão um chip laranja.
 * Só browser; sem dependências. Com reduced-motion faz apenas o salto do ícone.
 */
export function flyToCart(from: HTMLElement) {
  if (typeof window === "undefined") return;
  const target = [...document.querySelectorAll<HTMLElement>("[data-cart-target]")].find(
    (el) => el.offsetParent !== null,
  );
  if (!target) return;

  const bump = () => {
    target.classList.remove("cart-bump");
    void target.offsetWidth; // reinicia a animação se clicar várias vezes
    target.classList.add("cart-bump");
    target.addEventListener("animationend", () => target.classList.remove("cart-bump"), { once: true });
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return bump();

  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const sizePx = 56;
  const img = from.closest("article, [data-product]")?.querySelector<HTMLImageElement>("img");

  const ghost = document.createElement("div");
  ghost.setAttribute("aria-hidden", "true");
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${a.left + a.width / 2 - sizePx / 2}px`,
    top: `${a.top + a.height / 2 - sizePx / 2}px`,
    width: `${sizePx}px`,
    height: `${sizePx}px`,
    zIndex: "100",
    pointerEvents: "none",
    borderRadius: "10px",
    border: "2px solid var(--primary)",
    background: "var(--background)",
    boxShadow: "0 8px 24px oklch(0 0 0 / 45%), 0 0 14px color-mix(in oklch, var(--primary) 55%, transparent)",
    overflow: "hidden",
    display: "grid",
    placeItems: "center",
  } satisfies Partial<CSSStyleDeclaration>);
  if (img?.currentSrc || img?.src) {
    const i = document.createElement("img");
    i.src = img.currentSrc || img.src;
    i.alt = "";
    Object.assign(i.style, { width: "100%", height: "100%", objectFit: "cover" });
    ghost.appendChild(i);
  } else {
    // chip com pinos (igual ao ícone da marca)
    ghost.innerHTML =
      '<svg viewBox="0 0 32 32" width="34" height="34"><rect x="7" y="7" width="18" height="18" rx="3" fill="var(--primary)"/><path d="M10 3v4M14 3v4M18 3v4M22 3v4M10 25v4M14 25v4M18 25v4M22 25v4M3 10h4M3 14h4M3 18h4M3 22h4M25 10h4M25 14h4M25 18h4M25 22h4" stroke="var(--primary)" stroke-width="1.5" stroke-linecap="round"/></svg>';
  }
  document.body.appendChild(ghost);

  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const lift = Math.min(160, Math.abs(dy) * 0.35 + 60); // arco por cima
  const anim = ghost.animate(
    [
      { transform: "translate(0, 0) scale(0.6) rotate(0deg)", opacity: 0 },
      { transform: "translate(0, -14px) scale(1.05) rotate(-6deg)", opacity: 1, offset: 0.12 },
      {
        transform: `translate(${dx * 0.5}px, ${dy * 0.5 - lift}px) scale(0.8) rotate(10deg)`,
        opacity: 1,
        offset: 0.55,
      },
      { transform: `translate(${dx}px, ${dy}px) scale(0.18) rotate(20deg)`, opacity: 0.4 },
    ],
    { duration: 850, easing: "cubic-bezier(0.45, 0, 0.25, 1)" },
  );
  anim.onfinish = anim.oncancel = () => {
    ghost.remove();
    bump();
  };
}
