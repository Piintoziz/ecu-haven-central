# ECU Hub Pro

Prompt para Lovable — Base do site "Centralinas"

Cria a base de um website moderno e profissional para uma empresa especializada em centralinas automóveis (ECUs) — venda, reparação e reprogramação — que se posiciona como detentora do maior stock de centralinas da Europa. Foco nesta fase: frontend e design (sem lógica de backend, carrinho ou pagamentos reais ainda — usar dados mock/estáticos e deixar a interface pronta para integração futura).

1. Sobre a empresa

Negócio: venda de centralinas usadas/recondicionadas (motor, ABS, airbag, caixa de velocidades, etc.) para praticamente todas as marcas e modelos de automóveis.

Serviços adicionais: reparação de centralinas, reprogramação, clonagem, remoção de imobilizador, serviços de diagnóstico (ex: remoção de FAP/DPF, EGR, sonda lambda — apresentar como serviços técnicos, sem detalhes de "como fazer").

Público-alvo: oficinas, mecânicos profissionais, e particulares que procuram uma peça específica pela referência.

Diferenciador: stock enorme, pesquisa rápida por referência/marca/modelo, confiança e rapidez de entrega.

2. Identidade visual (a propor)

O site antigo usa laranja/preto, com aspecto datado. Quero uma imagem de marca nova, moderna e mais premium/técnica, que transmita confiança, precisão e tecnologia automóvel — não uma oficina de bairro.

Sugestões de direção (o Lovable pode escolher a que melhor equilibra estas referências):

Paleta principal: azul-petróleo escuro / grafite como base (transmite tecnologia e confiança), com um acento vibrante (laranja-âmbar ou verde-lima elétrico) usado com moderação em CTAs e detalhes — mantém alguma ligação visual à marca antiga sem parecer antiquado.

Tipografia: sans-serif técnica e limpa (ex: estilo Inter/Manrope para texto, algo mais geométrico para títulos).

Estética: cartões com bordas subtis, sombras suaves, iconografia técnica (circuitos, chips, engrenagens estilizadas), fotografia de produto em fundo escuro tipo "estúdio".

Evitar: aspecto de loja genérica de e-commerce; deve parecer uma referência técnica/especializada, não um bazar.

Pede ao Lovable para apresentar a proposta de paleta de cores + tipografia logo no início, antes de aplicar a todo o site.

3. Estrutura de páginas

Homepage

Hero forte com proposta de valor ("O maior stock de centralinas da Europa") + barra de pesquisa em destaque (por referência OEM, marca ou modelo).

Secção de confiança: nº de referências em stock, marcas cobertas, anos de experiência, garantia.

Categorias principais (Centralinas de Motor, ABS, Airbag, Caixa de Velocidades, etc.) em cards visuais.

Secção "Como funciona" (3-4 passos: pesquisar referência → confirmar compatibilidade → encomendar → receber/acompanhar).

Secção de serviços (reparação, reprogramação, clonagem, diagnóstico) com CTA para página de serviços.

Testemunhos/avaliações de clientes (mock).

Logos de marcas de automóveis suportadas (grelha).

Footer completo com contactos, redes sociais, links institucionais.

Catálogo / Loja

Grelha de produtos (centralinas) com filtros laterais: marca do carro, modelo, tipo de centralina, referência OEM, disponibilidade.

Pesquisa proeminente por referência (é o principal método de procura destes clientes).

Cards de produto: imagem, referência, marca/modelo compatível, estado (usado/recondicionado), preço, badge de disponibilidade (em stock / sob encomenda).

Usar dados mock representativos (10–20 produtos fictícios mas realistas, com referências no formato real, ex: "0281016000", "8E0909561").

Página de produto

Galeria de imagens, referência(s) OEM associadas, lista de compatibilidade (marca/modelo/ano/motor), preço, botão "Adicionar ao carrinho" (visual, sem lógica), garantia, ficha técnica, produtos relacionados.

Serviços

Cards/secções detalhadas para cada serviço (reparação, reprogramação, clonagem, remoção de imobilizador, diagnóstico), com descrição, ícone, e CTA de contacto/orçamento.

Como acompanhar a minha encomenda (UI apenas, mock)

Interface visual do tracking com estados: Encomenda confirmada → Em preparação → Enviada → Em trânsito → Entregue, tipo stepper/timeline horizontal, com espaço para nº de encomenda e transportadora.

Esta página serve como protótipo visual — sem lógica real ainda.

Carrinho / Checkout (apenas UI/UX, mock)

Layout do carrinho e de um checkout em passos (dados → envio → pagamento → confirmação), com placeholders para métodos de pagamento (Multibanco, MB Way, cartão).

Sobre nós

História, missão, números da empresa, equipa (opcional).

Contactos

Formulário, morada, mapa, telefone, horário.

4. Requisitos técnicos e de UX

Site totalmente responsivo (mobile-first, já que muitos mecânicos vão pesquisar do telemóvel na oficina).

Pesquisa por referência deve ser muito visível e rápida em todas as páginas relevantes (input com autocomplete simulado).

Usar componentes reutilizáveis e consistentes (design system simples: botões, badges, cards, inputs).

Estados vazios, loading states e microinterações cuidadas (hover em cards, transições suaves).

Acessibilidade básica (contraste adequado, tamanhos de toque em mobile).

Performance: imagens otimizadas, lazy loading nas grelhas de produto.

Deixar comentários no código a indicar onde entrará futuramente a lógica de backend (autenticação, carrinho real, pagamentos, tracking real com API de transportadora, importação de stock via Excel/CSV).

5. Fora de âmbito nesta fase (mencionar mas não implementar)

Lógica de pagamentos reais.

Importação/sincronização de stock a partir de Excel (isto será tratado depois, via painel de admin/backend).

Autenticação de utilizadores real.

Tracking real de encomendas com transportadoras.

6. Tom pedido ao Lovable

Constrói isto com o nível de acabamento de uma marca premium do setor automóvel — não uma loja online genérica. Prioriza clareza, confiança e velocidade de pesquisa, já que o cliente típico já sabe a referência que procura. Apresenta primeiro a proposta de paleta/tipografia, e só depois avança para a construção completa das páginas.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/717a84ad-ca8d-496d-bd31-846d3867c4cc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Centralinas — configuração

1. `cp .env.example .env` e preencher `SUPABASE_SERVICE_ROLE_KEY` (só servidor) e `VITE_SITE_URL`.
2. `npm i && npm run dev`
3. Antes de cada entrega: `npm run build && npm run typecheck`.

### Arquitetura

| Camada | Onde | Notas |
| --- | --- | --- |
| Catálogo (leitura) | `src/lib/catalog.ts` | Chave pública + RLS. Funções SQL `search_catalog`, `get_product`, `catalog_facets`, `shipping_quote`. |
| Encomendas, tracking, contactos | `src/lib/*.functions.ts` | `createServerFn` + Zod + rate limit + Turnstile + honeypot. Service role só dentro dos handlers. |
| Checkout | `place_order` (SQL) | Recalcula preços, portes e IVA; reserva stock numa transação. |
| Emails | tabela `email_outbox` | Fila preenchida automaticamente; falta o worker de envio (Resend/SMTP). |
| Pagamentos | `src/lib/payments.ts` | Interface `PaymentProvider` para Stripe/PayPal (próxima fase). |
| SEO | `src/lib/seo.ts`, `/sitemap.xml`, `/robots.txt` | URL canónico `/centralinas/[fabricante-referencia]`, JSON-LD `Product` + `BreadcrumbList`. |
| Segurança HTTP | `src/server.ts` | CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, redirecionamento HTTPS (produção). |

### Base de dados

Migrações em `supabase/migrations/`, dados de referência e produtos DEMO em `supabase/seed.sql`.
Remover os produtos de demonstração antes do lançamento:

```sql
delete from public.products where sku like 'DEMO-%';
```
