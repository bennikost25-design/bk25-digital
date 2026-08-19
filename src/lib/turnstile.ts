export type TurnstileVerifyResult =
  | { ok: true }
  | { ok: false; reason: "missing" | "invalid" | "unavailable" };

export async function verifyTurnstile(options: {
  token: string;
  secret: string;
  expectedHostname?: string;
  expectedAction?: string;
  remoteip?: string;
  fetchImpl?: typeof fetch;
}): Promise<TurnstileVerifyResult> {
  if (!options.token) return { ok: false, reason: "missing" };

  const body = new URLSearchParams();
  body.set("secret", options.secret);
  body.set("response", options.token);
  if (options.remoteip) body.set("remoteip", options.remoteip);

  try {
    const fetchImpl = options.fetchImpl ?? fetch;
    const response = await fetchImpl(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    if (!response.ok) return { ok: false, reason: "unavailable" };
    const data = (await response.json()) as {
      success?: boolean;
      hostname?: string;
      action?: string;
      "error-codes"?: string[];
    };
    if (!data.success) return { ok: false, reason: "invalid" };
    if (options.expectedHostname) {
      if (!data.hostname || data.hostname !== options.expectedHostname) {
        return { ok: false, reason: "invalid" };
      }
    }
    if (options.expectedAction) {
      if (!data.action || data.action !== options.expectedAction) {
        return { ok: false, reason: "invalid" };
      }
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
