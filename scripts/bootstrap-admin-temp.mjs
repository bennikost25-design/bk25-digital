import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Write SQL into a temporary directory, run work against the file path,
 * then always remove the directory (including on thrown errors).
 *
 * @template T
 * @param {string} fileName
 * @param {string} contents
 * @param {(filePath: string) => T | Promise<T>} runner
 * @returns {Promise<T>}
 */
export async function withTemporarySqlFile(fileName, contents, runner) {
  if (typeof fileName !== "string" || fileName.length === 0) {
    throw new Error("Temporärer SQL-Dateiname fehlt.");
  }
  if (typeof contents !== "string") {
    throw new Error("Temporärer SQL-Inhalt fehlt.");
  }
  if (typeof runner !== "function") {
    throw new Error("Temporärer SQL-Runner fehlt.");
  }

  const dir = await mkdtemp(join(tmpdir(), "bk25-bootstrap-"));
  const filePath = join(dir, fileName);
  try {
    await writeFile(filePath, contents, "utf8");
    return await runner(filePath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
