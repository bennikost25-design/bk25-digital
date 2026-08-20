import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildRemoteWranglerArgs,
  resolveBootstrapMode,
} from "../scripts/bootstrap-admin-mode.mjs";

const FAKE_EMAIL = "admin@example.test";
const FAKE_PASSWORD = "fake-password-not-real";
const FAKE_HASH = "$fake$hash$value.not.a.real.hash";
const FAKE_SQL_PATH = "/tmp/bk25-bootstrap-fake/lookup.sql";

function expectNoSecrets(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  expect(text).not.toContain(FAKE_PASSWORD);
  expect(text).not.toContain(FAKE_HASH);
  expect(text).not.toContain(FAKE_EMAIL);
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
  it("builds preview args with --env preview and never production", () => {
    const args = buildRemoteWranglerArgs("preview", FAKE_SQL_PATH, { json: true });
    expect(args).toEqual([
      "d1",
      "execute",
      "DB",
      "--env",
      "preview",
      "--remote",
      "--file",
      FAKE_SQL_PATH,
      "--json",
    ]);
    expect(args).toContain("--env");
    expect(args[args.indexOf("--env") + 1]).toBe("preview");
    expect(args).not.toContain("production");
    expectNoSecrets(args);
  });

  it("builds production args with --env production", () => {
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

  it("rejects free-form environments", () => {
    expect(() =>
      // @ts-expect-error intentional invalid env for safety coverage
      buildRemoteWranglerArgs("staging", FAKE_SQL_PATH),
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
