/**
 * Draft storage for customer forms (browser localStorage only).
 */

export type FormDraft<T extends Record<string, unknown> = Record<string, unknown>> = {
  values: T;
  stepIndex: number;
  updatedAt: string;
};

export function loadDraft<T extends Record<string, unknown>>(
  key: string,
): FormDraft<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as FormDraft<T>;
  } catch {
    return null;
  }
}

export function saveDraft<T extends Record<string, unknown>>(
  key: string,
  draft: FormDraft<T>,
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(draft));
}

export function clearDraft(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}
