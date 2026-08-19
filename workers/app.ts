/// <reference types="@cloudflare/workers-types" />

// @ts-expect-error -- generated after OpenNext build
import { default as handler } from "../.open-next/worker.js";
import { processEmailQueueBatch, requeueStuckOutbox } from "../src/server/email-processor";

export default {
  async fetch(request, env, ctx) {
    const response = await handler.fetch(request, env, ctx);
    if (env.APP_ENV === "production") {
      const headers = new Headers(response.headers);
      headers.set(
        "Strict-Transport-Security",
        "max-age=63072000; includeSubDomains; preload",
      );
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
    return response;
  },

  async queue(batch, env) {
    await processEmailQueueBatch(batch as MessageBatch<{ outboxId?: string }>, env);
  },

  async scheduled(_controller, env) {
    await requeueStuckOutbox(env);
  },
} satisfies ExportedHandler<CloudflareEnv>;

// @ts-expect-error -- generated after OpenNext build
export { DOQueueHandler, DOShardedTagCache } from "../.open-next/worker.js";
