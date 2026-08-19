export function createId(): string {
  return crypto.randomUUID();
}

export function nowMs(): number {
  return Date.now();
}

export function toDate(ms: number | Date | null | undefined): Date | null {
  if (ms == null) return null;
  return ms instanceof Date ? ms : new Date(ms);
}

export function createReferenceNumber(prefix = "BK25"): string {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const rand = crypto.getRandomValues(new Uint32Array(1))[0] % 10000;
  return `${prefix}-${stamp}-${String(rand).padStart(4, "0")}`;
}

export function jsonStringify(value: unknown): string {
  return JSON.stringify(value);
}

export function jsonParse<T>(value: string): T {
  return JSON.parse(value) as T;
}
