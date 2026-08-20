/**
 * Pure helpers for bootstrap-admin mode selection and Wrangler D1 args.
 * Keep env names fixed to preview|production — never accept free-form env input.
 */

export const ALLOWED_BOOTSTRAP_FLAGS = Object.freeze([
  "--preview",
  "--production",
  "--remote",
  "--confirm-preview",
  "--confirm-production",
]);

const ALLOWED_SET = new Set(ALLOWED_BOOTSTRAP_FLAGS);

/**
 * @typedef {{ kind: "local" }} LocalBootstrapMode
 * @typedef {{ kind: "remote", env: "preview" | "production", label: string }} RemoteBootstrapMode
 * @typedef {{ ok: true, mode: LocalBootstrapMode | RemoteBootstrapMode }} BootstrapModeOk
 * @typedef {{ ok: false, error: string }} BootstrapModeErr
 * @typedef {BootstrapModeOk | BootstrapModeErr} BootstrapModeResult
 */

/**
 * @param {string[]} argv process.argv.slice(2) style flags only
 * @returns {BootstrapModeResult}
 */
export function resolveBootstrapMode(argv) {
  const flags = Array.isArray(argv) ? argv : [];
  const unknown = flags.filter((flag) => !ALLOWED_SET.has(flag));
  if (unknown.length > 0) {
    return {
      ok: false,
      error: `Unbekanntes Bootstrap-Flag: ${unknown[0]}. Erlaubt sind nur --preview|--production mit --remote und der passenden Bestätigung.`,
    };
  }

  const set = new Set(flags);
  const hasPreview = set.has("--preview");
  const hasProduction = set.has("--production");
  const hasRemote = set.has("--remote");
  const hasConfirmPreview = set.has("--confirm-preview");
  const hasConfirmProduction = set.has("--confirm-production");
  const anyFlag =
    hasPreview || hasProduction || hasRemote || hasConfirmPreview || hasConfirmProduction;

  if (!anyFlag) {
    return { ok: true, mode: { kind: "local" } };
  }

  if (hasPreview && hasProduction) {
    return {
      ok: false,
      error: "Preview- und Produktionsbootstrap dürfen nicht kombiniert werden.",
    };
  }

  if (hasPreview && hasConfirmProduction) {
    return {
      ok: false,
      error: "Preview-Bootstrap darf nicht mit --confirm-production verwendet werden.",
    };
  }

  if (hasProduction && hasConfirmPreview) {
    return {
      ok: false,
      error: "Produktionsbootstrap darf nicht mit --confirm-preview verwendet werden.",
    };
  }

  if (hasConfirmPreview && hasConfirmProduction) {
    return {
      ok: false,
      error: "Preview- und Produktionsbestätigung dürfen nicht kombiniert werden.",
    };
  }

  const isExactPreview =
    hasPreview &&
    hasRemote &&
    hasConfirmPreview &&
    !hasProduction &&
    !hasConfirmProduction &&
    set.size === 3;

  if (isExactPreview) {
    return {
      ok: true,
      mode: {
        kind: "remote",
        env: "preview",
        label: "Preview-D1 remote",
      },
    };
  }

  if (hasPreview || hasConfirmPreview) {
    return {
      ok: false,
      error:
        "Preview-Bootstrap verlangt ausdrücklich --preview --remote --confirm-preview.",
    };
  }

  const isExactProduction =
    hasProduction &&
    hasRemote &&
    hasConfirmProduction &&
    !hasPreview &&
    !hasConfirmPreview &&
    set.size === 3;

  if (isExactProduction) {
    return {
      ok: true,
      mode: {
        kind: "remote",
        env: "production",
        label: "Production-D1 remote",
      },
    };
  }

  return {
    ok: false,
    error:
      "Produktionsbootstrap verlangt ausdrücklich --production --remote --confirm-production.",
  };
}

/**
 * Remote INSERT / mutation args: SQL stays in a temp file so secrets never
 * appear as process arguments.
 *
 * @param {"preview" | "production"} env
 * @param {string} filePath
 * @param {{ json?: boolean }} [options]
 * @returns {string[]}
 */
export function buildRemoteWranglerArgs(env, filePath, options = {}) {
  if (env !== "preview" && env !== "production") {
    throw new Error("Ungültiges Bootstrap-Ziel.");
  }
  if (typeof filePath !== "string" || filePath.length === 0) {
    throw new Error("SQL-Datei für Remote-Bootstrap fehlt.");
  }

  const args = ["d1", "execute", "DB", "--env", env, "--remote", "--file", filePath];
  if (options.json) {
    args.push("--json");
  }
  return args;
}

/**
 * Remote SELECT lookup args: use --command so Wrangler returns query rows.
 * `--file` only reports execution stats and must not be used for lookups.
 *
 * @param {"preview" | "production"} env
 * @param {string} sqlCommand
 * @returns {string[]}
 */
export function buildRemoteWranglerLookupArgs(env, sqlCommand) {
  if (env !== "preview" && env !== "production") {
    throw new Error("Ungültiges Bootstrap-Ziel.");
  }
  if (typeof sqlCommand !== "string" || sqlCommand.trim().length === 0) {
    throw new Error("SQL-Befehl für Remote-Lookup fehlt.");
  }

  return [
    "d1",
    "execute",
    "DB",
    "--env",
    env,
    "--remote",
    "--command",
    sqlCommand,
    "--json",
  ];
}
