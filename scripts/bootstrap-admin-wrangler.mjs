import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ANSI_ESCAPE_RE = /\u001B\[[0-9;]*m/g;

/**
 * Strip ANSI color codes that Wrangler may emit around warnings.
 * @param {string} text
 */
export function stripAnsi(text) {
  return String(text ?? "").replace(ANSI_ESCAPE_RE, "");
}

/**
 * Resolve the project root (repository root containing package.json / wrangler.jsonc).
 * @param {string} [fromUrl] import.meta.url of the calling module
 */
export function resolveProjectRoot(fromUrl = import.meta.url) {
  return dirname(dirname(fileURLToPath(fromUrl)));
}

/**
 * Absolute path to the local Wrangler CLI entry (node_modules/wrangler/bin/wrangler.js).
 * @param {string} [projectRoot]
 */
export function resolveLocalWranglerCli(projectRoot = resolveProjectRoot()) {
  return join(projectRoot, "node_modules", "wrangler", "bin", "wrangler.js");
}

/**
 * Build a shell-free spawn definition for the local Wrangler CLI.
 * Uses process.execPath + wrangler.js and passes args as a separate array.
 *
 * @param {string[]} wranglerArgs
 * @param {{ projectRoot?: string, execPath?: string }} [options]
 * @returns {{ execPath: string, args: string[], cwd: string, shell: false, stdio: ["ignore","pipe","pipe"] }}
 */
export function buildWranglerSpawnDefinition(wranglerArgs, options = {}) {
  const projectRoot = options.projectRoot ?? resolveProjectRoot();
  const execPath = options.execPath ?? process.execPath;
  const cliPath = resolveLocalWranglerCli(projectRoot);

  if (!existsSync(cliPath)) {
    throw new Error(
      "Lokale Wrangler-CLI fehlt. Bitte zuerst die Projektabhängigkeiten installieren (`npm install`).",
    );
  }

  if (!Array.isArray(wranglerArgs)) {
    throw new Error("Wrangler-Argumente fehlen.");
  }

  return {
    execPath,
    args: [cliPath, ...wranglerArgs],
    cwd: projectRoot,
    shell: false,
    stdio: /** @type {["ignore","pipe","pipe"]} */ (["ignore", "pipe", "pipe"]),
  };
}

/**
 * Try to extract and parse the first plausible JSON value that starts at a line
 * beginning with `{` or `[` (after ANSI stripping). Avoids matching `[WARNING]`.
 *
 * @param {string} raw
 * @returns {unknown}
 */
export function extractJsonValue(raw) {
  const text = stripAnsi(raw);
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Die Remote-D1-Abfrage konnte nicht gelesen werden.");
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    // Fall through to line-based search when leading warning text is present.
  }

  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const start = line.search(/[\[{]/);
    if (start < 0) continue;

    // JSON must begin at the start of the line (ignoring leading whitespace).
    // This rejects mid-line markers such as `[WARNING]`.
    if (line.slice(0, start).trim() !== "") continue;

    const candidate = [...lines.slice(i)];
    candidate[0] = line.slice(start);
    const blob = candidate.join("\n").trim();
    if (!blob.startsWith("{") && !blob.startsWith("[")) continue;

    try {
      return JSON.parse(blob);
    } catch {
      // Try a later line that may contain the real JSON payload.
    }
  }

  throw new Error("Die Remote-D1-Abfrage konnte nicht gelesen werden.");
}

/**
 * Validate Wrangler D1 `--json` output and return result rows.
 * Empty results mean the user does not exist.
 *
 * @param {string} rawStdout
 * @returns {{ results: Array<Record<string, unknown>>, role: string | null }}
 */
export function parseWranglerD1LookupOutput(rawStdout) {
  const parsed = extractJsonValue(rawStdout);

  /** @type {unknown} */
  let execution = null;
  if (Array.isArray(parsed)) {
    if (parsed.length < 1) {
      throw new Error("Die Remote-D1-Abfrage konnte nicht gelesen werden.");
    }
    execution = parsed[0];
  } else if (parsed && typeof parsed === "object") {
    execution = parsed;
  } else {
    throw new Error("Die Remote-D1-Abfrage konnte nicht gelesen werden.");
  }

  if (!execution || typeof execution !== "object") {
    throw new Error("Die Remote-D1-Abfrage konnte nicht gelesen werden.");
  }

  const record = /** @type {Record<string, unknown>} */ (execution);
  if (record.success !== true) {
    throw new Error("Die Remote-D1-Abfrage konnte nicht gelesen werden.");
  }
  if (!Array.isArray(record.results)) {
    throw new Error("Die Remote-D1-Abfrage konnte nicht gelesen werden.");
  }

  const results = /** @type {Array<Record<string, unknown>>} */ (record.results);
  if (results.length === 0) {
    return { results, role: null };
  }

  const first = results[0];
  if (!first || typeof first !== "object" || typeof first.role !== "string" || first.role.length === 0) {
    throw new Error("Die Remote-D1-Abfrage konnte nicht gelesen werden.");
  }

  return { results, role: first.role };
}
