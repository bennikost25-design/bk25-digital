import { access, constants } from "node:fs/promises";
import { dirname } from "node:path";
import { describe, expect, it } from "vitest";
import { withTemporarySqlFile } from "../scripts/bootstrap-admin-temp.mjs";

const FAKE_PASSWORD = "fake-password-not-real-xx";
const FAKE_HASH = "$fake$hash$value.not.a.real.hash";
const FAKE_EMAIL = "admin@example.test";
const SAFE_FAILURE = "Der Remote-D1-Befehl ist fehlgeschlagen.";

async function expectPathMissing(path: string) {
  await expect(access(path, constants.F_OK)).rejects.toMatchObject({
    code: "ENOENT",
  });
}

describe("bootstrap temporary SQL cleanup", () => {
  it("removes insert.sql and its temp directory when the runner throws", async () => {
    let capturedFile: string | null = null;
    let capturedDir: string | null = null;
    let sawFileDuringRun = false;

    let thrown: unknown;
    try {
      await withTemporarySqlFile(
        "insert.sql",
        [
          `insert into account (password) values ('${FAKE_HASH}');`,
          `-- ${FAKE_EMAIL}`,
          `-- ${FAKE_PASSWORD}`,
          "",
        ].join("\n"),
        async (filePath) => {
          capturedFile = filePath;
          capturedDir = dirname(filePath);
          await access(filePath, constants.F_OK);
          sawFileDuringRun = true;
          throw new Error(SAFE_FAILURE);
        },
      );
    } catch (error) {
      thrown = error;
    }

    expect(sawFileDuringRun).toBe(true);
    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBe(SAFE_FAILURE);
    expect((thrown as Error).message).not.toContain(FAKE_PASSWORD);
    expect((thrown as Error).message).not.toContain(FAKE_HASH);
    expect((thrown as Error).message).not.toContain(FAKE_EMAIL);

    expect(capturedFile).toBeTruthy();
    expect(capturedDir).toBeTruthy();
    await expectPathMissing(capturedFile!);
    await expectPathMissing(capturedDir!);
  });

  it("removes lookup.sql and its temp directory when the runner throws", async () => {
    let capturedFile: string | null = null;
    let capturedDir: string | null = null;

    await expect(
      withTemporarySqlFile(
        "lookup.sql",
        `select id, role from user where email = '${FAKE_EMAIL}';\n`,
        async (filePath) => {
          capturedFile = filePath;
          capturedDir = dirname(filePath);
          await access(filePath, constants.F_OK);
          throw new Error(SAFE_FAILURE);
        },
      ),
    ).rejects.toThrow(SAFE_FAILURE);

    expect(capturedFile).toBeTruthy();
    expect(capturedDir).toBeTruthy();
    await expectPathMissing(capturedFile!);
    await expectPathMissing(capturedDir!);
  });
});
