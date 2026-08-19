export const MAX_JSON_BYTES = 180_000;

export async function readJsonBody<T>(request: Request): Promise<T> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_JSON_BYTES) {
    throw new BodyLimitError();
  }
  const text = await request.text();
  if (text.length > MAX_JSON_BYTES) {
    throw new BodyLimitError();
  }
  return JSON.parse(text) as T;
}

export class BodyLimitError extends Error {
  constructor() {
    super("Die Anfrage ist zu groß.");
    this.name = "BodyLimitError";
  }
}

export function apiError(message: string, status: number, extra?: Record<string, unknown>) {
  return Response.json({ error: message, ...extra }, { status });
}
