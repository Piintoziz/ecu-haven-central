// Leitura de segredos de servidor. NUNCA importar este ficheiro em código
// que corre no browser — só dentro de handlers de createServerFn / server routes.

type ProcessLike = { env: Record<string, string | undefined> };

export function serverEnv(name: string): string | undefined {
  if (typeof window !== "undefined") {
    throw new Error(`serverEnv("${name}") chamado no cliente`);
  }
  const proc = (globalThis as { process?: ProcessLike }).process;
  const value = proc?.env?.[name];
  return value && value.trim() !== "" ? value : undefined;
}
