import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function walkFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (
      name === "node_modules" ||
      name === ".git" ||
      name === ".open-next" ||
      name === ".wrangler" ||
      name === ".next"
    ) {
      continue;
    }
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walkFiles(full, acc);
    } else {
      acc.push(full);
    }
  }
  return acc;
}

describe("bootstrap and deployment safety", () => {
  const bootstrap = readFileSync("scripts/bootstrap-admin.mjs", "utf8");
  const docs = readFileSync("docs/CLOUDFLARE_DEPLOYMENT.md", "utf8");
  const wrangler = readFileSync("wrangler.jsonc", "utf8");

  it("does not wrap production D1 SQL in BEGIN/COMMIT", () => {
    expect(bootstrap).not.toMatch(/\bBEGIN\s*;/i);
    expect(bootstrap).not.toMatch(/\bCOMMIT\s*;/i);
    expect(bootstrap).toContain("mkdtemp(");
    expect(bootstrap).toContain("rm(insertDir, { recursive: true, force: true })");
    expect(bootstrap).toContain("--production");
    expect(bootstrap).toContain("--remote");
    expect(bootstrap).toContain("--confirm-production");
  });

  it("forces local getPlatformProxy to disable remote bindings", () => {
    expect(bootstrap).toContain("getPlatformProxy({ remoteBindings: false })");
    const calls = bootstrap.match(/getPlatformProxy\s*\(/g) ?? [];
    expect(calls).toHaveLength(1);
  });

  it("does not enable remote bindings anywhere in local config or scripts", () => {
    expect(wrangler).not.toMatch(/["']remote["']\s*:\s*true/);
    const files = walkFiles(".").filter((file) =>
      /\.(ts|tsx|mjs|js|jsonc|md)$/.test(file),
    );
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toMatch(/remoteBindings\s*:\s*true/);
    }
    const proxyCalls = files.flatMap((file) => {
      const text = readFileSync(file, "utf8");
      return [...text.matchAll(/getPlatformProxy\s*\(([^)]*)\)/g)].map((match) => ({
        file,
        args: match[1].replace(/\s+/g, " ").trim(),
      }));
    });
    expect(proxyCalls.length).toBeGreaterThan(0);
    for (const call of proxyCalls) {
      expect(call.args, call.file).toContain("remoteBindings: false");
    }
    expect(readFileSync("next.config.ts", "utf8")).toContain(
      "initOpenNextCloudflareForDev({ remoteBindings: false })",
    );
  });

  it("documents remote D1 migrations with --remote", () => {
    expect(docs).toContain("npx wrangler d1 migrations apply DB --env preview --remote");
    expect(docs).toContain("npx wrangler d1 migrations apply DB --env production --remote");
    expect(docs).not.toMatch(/npx wrangler d1 migrations apply DB --env preview\s*$/m);
    expect(docs).not.toMatch(/npx wrangler d1 migrations apply DB --env production\s*$/m);
  });
});
