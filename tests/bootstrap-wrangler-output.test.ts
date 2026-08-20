import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildWranglerSpawnDefinition,
  parseWranglerD1LookupOutput,
  resolveLocalWranglerCli,
  resolveProjectRoot,
  stripAnsi,
} from "../scripts/bootstrap-admin-wrangler.mjs";

const FAKE_EMAIL = "admin@example.test";
const FAKE_PASSWORD = "fake-password-not-real-xx";
const FAKE_HASH = "$fake$hash$value.not.a.real.hash";
const SAFE_ERROR = "Die Remote-D1-Abfrage konnte nicht gelesen werden.";

const PURE_EMPTY = `[
  {
    "results": [],
    "success": true,
    "meta": {}
  }
]`;

const PURE_ADMIN = `[
  {
    "results": [
      {
        "id": "user-fake-id",
        "role": "admin"
      }
    ],
    "success": true,
    "meta": {}
  }
]`;

const WARNING_PREFIX = `Processing wrangler.jsonc configuration:
  - "env.preview" environment configuration
    - "images" exists at the top level, but not on "env.preview".
      - "images" is not inherited by environments and must be specified explicitly.
        [WARNING] This may not work as expected for the images binding.
`;

function expectSafeError(fn: () => unknown) {
  try {
    fn();
    throw new Error("expected parse to throw");
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    const message = (error as Error).message;
    expect(message).toBe(SAFE_ERROR);
    expect(message).not.toContain(FAKE_EMAIL);
    expect(message).not.toContain(FAKE_PASSWORD);
    expect(message).not.toContain(FAKE_HASH);
  }
}

describe("parseWranglerD1LookupOutput", () => {
  it("accepts pure valid JSON with empty results", () => {
    const parsed = parseWranglerD1LookupOutput(PURE_EMPTY);
    expect(parsed.role).toBeNull();
    expect(parsed.results).toEqual([]);
  });

  it("accepts pure valid JSON with an admin row", () => {
    const parsed = parseWranglerD1LookupOutput(PURE_ADMIN);
    expect(parsed.role).toBe("admin");
    expect(parsed.results[0]?.role).toBe("admin");
  });

  it("tolerates representative warning text with [WARNING] before JSON", () => {
    const parsed = parseWranglerD1LookupOutput(`${WARNING_PREFIX}${PURE_EMPTY}`);
    expect(parsed.role).toBeNull();
    expect(parsed.results).toEqual([]);
  });

  it("tolerates ANSI color codes before JSON", () => {
    const colored = `\u001B[33m${WARNING_PREFIX}\u001B[0m\u001B[32m${PURE_ADMIN}\u001B[0m`;
    expect(stripAnsi(colored)).not.toContain("\u001B");
    const parsed = parseWranglerD1LookupOutput(colored);
    expect(parsed.role).toBe("admin");
  });

  it("rejects output without JSON using a secret-free error", () => {
    expectSafeError(() =>
      parseWranglerD1LookupOutput(
        `Processing wrangler.jsonc configuration:\n[WARNING] broken\n${FAKE_EMAIL}\n${FAKE_PASSWORD}\n${FAKE_HASH}`,
      ),
    );
  });

  it("rejects JSON with success false", () => {
    expectSafeError(() =>
      parseWranglerD1LookupOutput(
        JSON.stringify([{ results: [], success: false, meta: {} }]),
      ),
    );
  });

  it("rejects JSON without a results array", () => {
    expectSafeError(() =>
      parseWranglerD1LookupOutput(
        JSON.stringify([{ success: true, meta: {} }]),
      ),
    );
  });

  it("rejects a row without a valid string role", () => {
    expectSafeError(() =>
      parseWranglerD1LookupOutput(
        JSON.stringify([
          {
            success: true,
            results: [{ id: "user-fake-id", role: null }],
          },
        ]),
      ),
    );
    expectSafeError(() =>
      parseWranglerD1LookupOutput(
        JSON.stringify([
          {
            success: true,
            results: [{ id: "user-fake-id" }],
          },
        ]),
      ),
    );
  });
});

describe("buildWranglerSpawnDefinition", () => {
  it("uses process.execPath, local wrangler.js, no npx, and shell false", () => {
    const projectRoot = resolveProjectRoot();
    const cliPath = resolveLocalWranglerCli(projectRoot);
    expect(existsSync(cliPath)).toBe(true);

    const wranglerArgs = [
      "d1",
      "execute",
      "DB",
      "--env",
      "preview",
      "--remote",
      "--file",
      join(projectRoot, "tmp-fake", "lookup.sql"),
      "--json",
    ];
    const definition = buildWranglerSpawnDefinition(wranglerArgs, {
      projectRoot,
      execPath: process.execPath,
    });

    expect(definition.execPath).toBe(process.execPath);
    expect(definition.shell).toBe(false);
    expect(definition.cwd).toBe(projectRoot);
    expect(definition.stdio).toEqual(["ignore", "pipe", "pipe"]);
    expect(definition.args[0]).toBe(cliPath);
    expect(definition.args.slice(1)).toEqual(wranglerArgs);
    expect(definition.args.join(" ")).not.toContain("npx");
    expect(definition.args).not.toContain("npx");
    expect(definition.args).not.toContain("npx.cmd");
    expect(JSON.stringify(definition)).not.toContain(FAKE_PASSWORD);
    expect(JSON.stringify(definition)).not.toContain(FAKE_HASH);
  });
});
