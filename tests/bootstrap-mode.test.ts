import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildRemoteWranglerArgs,
  buildRemoteWranglerLookupArgs,
  resolveBootstrapMode,
} from "../scripts/bootstrap-admin-mode.mjs";
import { buildWranglerSpawnDefinition } from "../scripts/bootstrap-admin-wrangler.mjs";

const FAKE_EMAIL = "admin@example.test";
const FAKE_PASSWORD = "fake-password-not-real";
const FAKE_HASH = "$fake$hash$value.not.a.real.hash";
const FAKE_SQL_PATH = "/tmp/bk25-bootstrap-fake/insert.sql";
const FAKE_LOOKUP_SQL = `select id, role from user where email = '${FAKE_EMAIL}';`;

function expectNoSecrets(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  expect(text).not.toContain(FAKE_PASSWORD);
  expect(text).not.toContain(FAKE_HASH);
}

describe("bootstrap mode selection", () => {
  it("selects local mode when no flags are provided", () => {
    const result = resolveBootstrapMode([]);
    expect(result).toEqual({ ok: true, mode: { kind: "local" } });
    expectNoSecrets(result);
  });

  it("selects preview remote only with the full preview confirmation", () => {
    const result = resolveBootstrapMode([
      "--preview",
      "--remote",
      "--confirm-preview",
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mode).toEqual({
      kind: "remote",
      env: "preview",
      label: "Preview-D1 remote",
    });
    expectNoSecrets(result);
  });

  it("selects production remote only with the full production confirmation", () => {
    const result = resolveBootstrapMode([
      "--production",
      "--remote",
      "--confirm-production",
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mode).toEqual({
      kind: "remote",
      env: "production",
      label: "Production-D1 remote",
    });
    expectNoSecrets(result);
  });

  it("rejects --remote alone", () => {
    const result = resolveBootstrapMode(["--remote"]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/--production --remote --confirm-production/);
    expectNoSecrets(result);
  });

  it("rejects incomplete preview confirmation", () => {
    const cases = [
      ["--preview"],
      ["--preview", "--remote"],
      ["--preview", "--confirm-preview"],
      ["--confirm-preview"],
      ["--remote", "--confirm-preview"],
    ];
    for (const argv of cases) {
      const result = resolveBootstrapMode(argv);
      expect(result.ok, argv.join(" ")).toBe(false);
      if (result.ok) continue;
      expect(result.error, argv.join(" ")).toMatch(
        /--preview --remote --confirm-preview/,
      );
      expectNoSecrets(result);
    }
  });

  it("rejects incomplete production confirmation", () => {
    const cases = [
      ["--production"],
      ["--production", "--remote"],
      ["--production", "--confirm-production"],
      ["--confirm-production"],
      ["--remote", "--confirm-production"],
    ];
    for (const argv of cases) {
      const result = resolveBootstrapMode(argv);
      expect(result.ok, argv.join(" ")).toBe(false);
      if (result.ok) continue;
      expect(result.error, argv.join(" ")).toMatch(
        /--production --remote --confirm-production/,
      );
      expectNoSecrets(result);
    }
  });

  it("rejects mixed preview and production flags", () => {
    const cases = [
      ["--preview", "--production"],
      ["--preview", "--remote", "--confirm-preview", "--production"],
      ["--preview", "--remote", "--confirm-production"],
      ["--production", "--remote", "--confirm-preview"],
      [
        "--preview",
        "--production",
        "--remote",
        "--confirm-preview",
        "--confirm-production",
      ],
      ["--confirm-preview", "--confirm-production"],
    ];
    for (const argv of cases) {
      const result = resolveBootstrapMode(argv);
      expect(result.ok, argv.join(" ")).toBe(false);
      expectNoSecrets(result);
    }
  });

  it("rejects unknown flags", () => {
    const result = resolveBootstrapMode(["--env", "preview"]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/Unbekanntes Bootstrap-Flag/);
    }
    expectNoSecrets(result);
  });
});

describe("remote wrangler arg builder", () => {
  it("builds lookup args with --command and never --file", () => {
    const args = buildRemoteWranglerLookupArgs("preview", FAKE_LOOKUP_SQL);
    expect(args).toEqual([
      "d1",
      "execute",
      "DB",
      "--env",
      "preview",
      "--remote",
      "--command",
      FAKE_LOOKUP_SQL,
      "--json",
    ]);
    expect(args).toContain("--command");
    expect(args).not.toContain("--file");
    expect(args[args.indexOf("--env") + 1]).toBe("preview");
    expect(args).not.toContain("production");
    expect(args[args.indexOf("--command") + 1]).toBe(FAKE_LOOKUP_SQL);
    expectNoSecrets(args);
  });

  it("builds insert file args with --file and never puts secrets in args", () => {
    const args = buildRemoteWranglerArgs("preview", FAKE_SQL_PATH);
    expect(args).toEqual([
      "d1",
      "execute",
      "DB",
      "--env",
      "preview",
      "--remote",
      "--file",
      FAKE_SQL_PATH,
    ]);
    expect(args).toContain("--file");
    expect(args).not.toContain("--command");
    expect(args).not.toContain("production");
    expectNoSecrets(args);
  });

  it("builds production insert args with --env production", () => {
    const args = buildRemoteWranglerArgs("production", FAKE_SQL_PATH);
    expect(args).toEqual([
      "d1",
      "execute",
      "DB",
      "--env",
      "production",
      "--remote",
      "--file",
      FAKE_SQL_PATH,
    ]);
    expect(args[args.indexOf("--env") + 1]).toBe("production");
    expect(args).not.toContain("preview");
    expectNoSecrets(args);
  });

  it("keeps lookup spawn shell-false with SQL as a separate argument", () => {
    const wranglerArgs = buildRemoteWranglerLookupArgs("preview", FAKE_LOOKUP_SQL);
    const definition = buildWranglerSpawnDefinition(wranglerArgs);
    expect(definition.shell).toBe(false);
    expect(definition.execPath).toBe(process.execPath);
    expect(definition.args).toContain("--command");
    expect(definition.args).not.toContain("--file");
    expect(definition.args).not.toContain("npx");
    const commandIndex = definition.args.indexOf("--command");
    expect(definition.args[commandIndex + 1]).toBe(FAKE_LOOKUP_SQL);
    expectNoSecrets(definition);
  });

  it("rejects free-form environments", () => {
    expect(() =>
      // @ts-expect-error intentional invalid env for safety coverage
      buildRemoteWranglerArgs("staging", FAKE_SQL_PATH),
    ).toThrow(/Ungültiges Bootstrap-Ziel/);
    expect(() =>
      // @ts-expect-error intentional invalid env for safety coverage
      buildRemoteWranglerLookupArgs("staging", FAKE_LOOKUP_SQL),
    ).toThrow(/Ungültiges Bootstrap-Ziel/);
  });
});

describe("bootstrap scripts stay confirmation-explicit", () => {
  it("does not embed confirm flags in package.json scripts", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    const script = pkg.scripts["bootstrap:admin"];
    expect(script).toBe("node scripts/bootstrap-admin.mjs");
    expect(script).not.toContain("--confirm-preview");
    expect(script).not.toContain("--confirm-production");
  });
});
