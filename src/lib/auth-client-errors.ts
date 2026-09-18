import {
  RATE_LIMITED_CODE,
  RATE_LIMIT_UNAVAILABLE_CODE,
} from "@/lib/rate-limit";

export type AuthClientFailure = {
  status?: number;
  statusText?: string;
  code?: string;
  message?: string;
  error?: string;
  retryAfter?: unknown;
};

export type AuthClientErrorKind =
  | { kind: "credentials" }
  | { kind: "invalid_token" }
  | { kind: "password_invalid" }
  | { kind: "rate_limited"; retryAfterSeconds: number | null }
  | { kind: "unavailable" }
  | { kind: "network" }
  | { kind: "unknown" };

const INVALID_TOKEN_CODES = new Set([
  "INVALID_TOKEN",
  "TOKEN_EXPIRED",
  "USER_NOT_FOUND",
]);

const PASSWORD_INVALID_CODES = new Set([
  "PASSWORD_TOO_SHORT",
  "PASSWORD_TOO_LONG",
  "VALIDATION_ERROR",
]);

export function parseRetryAfterSeconds(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.max(0, Math.ceil(value));
  }
  if (typeof value === "string" && value.trim()) {
    const seconds = Number(value.trim());
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.max(0, Math.ceil(seconds));
    }
  }
  return null;
}

export function formatRetryAfterHint(seconds: number): string {
  if (seconds < 60) {
    const count = Math.max(1, seconds);
    return `Bitte in ${count} ${count === 1 ? "Sekunde" : "Sekunden"} erneut versuchen.`;
  }
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `Bitte in ${minutes} ${minutes === 1 ? "Minute" : "Minuten"} erneut versuchen.`;
}

function asAuthClientFailure(error: unknown): AuthClientFailure | null {
  if (!error || typeof error !== "object") return null;
  return error as AuthClientFailure;
}

function errorCode(error: AuthClientFailure): string {
  return typeof error.code === "string" ? error.code : "";
}

function isNetworkError(error: unknown, failure: AuthClientFailure | null): boolean {
  if (error instanceof TypeError) return true;
  if (failure && (failure.status === 0 || failure.statusText === "Failed to fetch")) return true;
  if (error instanceof Error && /failed to fetch|networkerror|load failed|network request failed/i.test(error.message)) {
    return true;
  }
  return false;
}

export function classifyAuthClientError(
  error: unknown,
  retryAfterHeader?: string | null,
): AuthClientErrorKind {
  if (isNetworkError(error, asAuthClientFailure(error))) {
    return { kind: "network" };
  }
  const failure = asAuthClientFailure(error);
  if (!failure) {
    return { kind: "unavailable" };
  }
  if (isNetworkError(error, failure)) {
    return { kind: "network" };
  }

  const status = typeof failure.status === "number" ? failure.status : undefined;
  const code = errorCode(failure);
  const retryAfterSeconds =
    parseRetryAfterSeconds(retryAfterHeader) ?? parseRetryAfterSeconds(failure.retryAfter);

  if (status === 429 || code === RATE_LIMITED_CODE) {
    return { kind: "rate_limited", retryAfterSeconds };
  }
  if (status === 503 || code === RATE_LIMIT_UNAVAILABLE_CODE || (typeof status === "number" && status >= 500)) {
    return { kind: "unavailable" };
  }
  if (INVALID_TOKEN_CODES.has(code)) {
    return { kind: "invalid_token" };
  }
  if (PASSWORD_INVALID_CODES.has(code)) {
    return { kind: "password_invalid" };
  }
  if (status === 401 || code === "INVALID_EMAIL_OR_PASSWORD") {
    return { kind: "credentials" };
  }
  if (typeof status === "number" && status >= 400 && status < 500) {
    return { kind: "unknown" };
  }
  if (typeof status !== "number") {
    return { kind: "network" };
  }
  return { kind: "unavailable" };
}

export const LOGIN_CREDENTIALS_MESSAGE =
  "Anmeldung nicht möglich. Bitte Angaben prüfen oder später erneut versuchen.";
export const LOGIN_UNAVAILABLE_MESSAGE =
  "Anmeldung ist vorübergehend nicht möglich. Bitte später erneut versuchen.";
export const LOGIN_NETWORK_MESSAGE =
  "Keine Verbindung. Bitte Netz prüfen und erneut versuchen.";
export const RESET_REQUEST_UNAVAILABLE_MESSAGE =
  "Die Anforderung ist vorübergehend nicht möglich. Bitte später erneut versuchen.";
export const RESET_REQUEST_NETWORK_MESSAGE =
  "Keine Verbindung. Bitte Netz prüfen und erneut versuchen.";
export const RESET_REQUEST_GENERIC_MESSAGE =
  "Die Anforderung konnte nicht gesendet werden. Bitte später erneut versuchen.";
export const RESET_PASSWORD_INVALID_LINK_MESSAGE =
  "Dieser Link ist ungültig oder abgelaufen.";
export const RESET_PASSWORD_INVALID_MESSAGE =
  "Bitte wählen Sie ein Passwort mit mindestens 12 Zeichen.";
export const RESET_PASSWORD_UNAVAILABLE_MESSAGE =
  "Das Passwort konnte vorübergehend nicht gespeichert werden. Bitte später erneut versuchen.";
export const RESET_PASSWORD_NETWORK_MESSAGE =
  "Keine Verbindung. Bitte Netz prüfen und erneut versuchen.";
export const RESET_PASSWORD_GENERIC_MESSAGE =
  "Das Passwort konnte nicht gespeichert werden. Bitte später erneut versuchen.";

function rateLimitedMessage(retryAfterSeconds: number | null, fallback: string): string {
  if (retryAfterSeconds == null) return fallback;
  return `Zu viele Versuche. ${formatRetryAfterHint(retryAfterSeconds)}`;
}

export function loginErrorMessage(error: unknown, retryAfterHeader?: string | null): string {
  const classified = classifyAuthClientError(error, retryAfterHeader);
  switch (classified.kind) {
    case "rate_limited":
      return rateLimitedMessage(classified.retryAfterSeconds, "Zu viele Versuche. Bitte später erneut versuchen.");
    case "unavailable":
      return LOGIN_UNAVAILABLE_MESSAGE;
    case "network":
      return LOGIN_NETWORK_MESSAGE;
    default:
      return LOGIN_CREDENTIALS_MESSAGE;
  }
}

export function passwordResetRequestErrorMessage(
  error: unknown,
  retryAfterHeader?: string | null,
): string {
  const classified = classifyAuthClientError(error, retryAfterHeader);
  switch (classified.kind) {
    case "rate_limited":
      return rateLimitedMessage(classified.retryAfterSeconds, "Zu viele Versuche. Bitte später erneut versuchen.");
    case "unavailable":
      return RESET_REQUEST_UNAVAILABLE_MESSAGE;
    case "network":
      return RESET_REQUEST_NETWORK_MESSAGE;
    default:
      return RESET_REQUEST_GENERIC_MESSAGE;
  }
}

export function resetPasswordErrorMessage(
  error: unknown,
  retryAfterHeader?: string | null,
): string {
  const classified = classifyAuthClientError(error, retryAfterHeader);
  switch (classified.kind) {
    case "invalid_token":
      return RESET_PASSWORD_INVALID_LINK_MESSAGE;
    case "password_invalid":
      return RESET_PASSWORD_INVALID_MESSAGE;
    case "rate_limited":
      return rateLimitedMessage(classified.retryAfterSeconds, "Zu viele Versuche. Bitte später erneut versuchen.");
    case "unavailable":
      return RESET_PASSWORD_UNAVAILABLE_MESSAGE;
    case "network":
      return RESET_PASSWORD_NETWORK_MESSAGE;
    default:
      return RESET_PASSWORD_GENERIC_MESSAGE;
  }
}
