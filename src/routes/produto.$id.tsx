import { createFileRoute, redirect } from "@tanstack/react-router";

// URL antigo (/produto/:id) -> URL canónico (/centralinas/:slug). Redirecionamento permanente.
export const Route = createFileRoute("/produto/$id")({
  beforeLoad: ({ params }) => {
    const slug = params.id.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!slug) throw redirect({ to: "/catalogo", statusCode: 301 });
    throw redirect({ to: "/centralinas/$slug", params: { slug }, statusCode: 301 });
  },
});
