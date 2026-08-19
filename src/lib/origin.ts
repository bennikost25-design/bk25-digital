export function getRequestOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (origin) return origin.replace(/\/+$/, "");
  const referer = request.headers.get("referer");
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export function localDevOrigins(): string[] {
  return [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8787",
    "http://127.0.0.1:8787",
  ];
}

export function allowedOrigins(siteUrl: string, appEnv?: string): string[] {
  const values = [siteUrl, ...((appEnv ?? "local") === "local" ? localDevOrigins() : [])];
  return [...new Set(values.map((value) => value.replace(/\/+$/, "")).filter(Boolean))];
}

export function assertTrustedOrigin(
  request: Request,
  allowedOrigin: string,
  appEnv?: string,
): void {
  if (request.method === "GET" || request.method === "HEAD") return;
  const origin = getRequestOrigin(request);
  const allowed = allowedOrigins(allowedOrigin, appEnv);
  if (!origin || !allowed.includes(origin)) {
    throw new OriginError();
  }
}

export class OriginError extends Error {
  constructor() {
    super("Ungültige Herkunft der Anfrage.");
    this.name = "OriginError";
  }
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "0.0.0.0"
  );
}
