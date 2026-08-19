import { getCloudflareContext } from "@opennextjs/cloudflare";
import { connection } from "next/server";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import { schema } from "@/db/schema";
import { assertSafeProductionBindings, parseAppEnv, type AppEnv } from "@/lib/env";

export type AppDb = DrizzleD1Database<typeof schema>;

export type CloudflareBindings = {
  DB: D1Database;
  EMAIL_QUEUE: Queue;
  ASSETS?: Fetcher;
};

export type RequestContext = {
  env: AppEnv;
  bindings: CloudflareBindings;
  db: AppDb;
};

export async function getRequestContext(): Promise<RequestContext> {
  await connection();
  const { env } = await getCloudflareContext({ async: true });
  const bindings = env as unknown as CloudflareEnv;
  if (!bindings.DB || !bindings.EMAIL_QUEUE) {
    throw new Error("Serverkonfiguration unvollständig.");
  }
  assertSafeProductionBindings(bindings);
  const appEnv = parseAppEnv(bindings as unknown as Record<string, string | undefined>);
  return {
    env: appEnv,
    bindings: {
      DB: bindings.DB,
      EMAIL_QUEUE: bindings.EMAIL_QUEUE,
    },
    db: drizzle(bindings.DB, { schema }),
  };
}

export function dbFromBinding(db: D1Database): AppDb {
  return drizzle(db, { schema });
}
