-- Launch hardening: rate-limit buckets, invitation consume nonce,
-- scoped submission uniqueness, outbox cancellation.
-- Existing 0001_init.sql is left unchanged.

ALTER TABLE invitation ADD COLUMN consume_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS invitation_consume_id_idx ON invitation ("consume_id");

CREATE UNIQUE INDEX IF NOT EXISTS form_submission_version_unique
  ON form_submission ("user_id", "project_id", "form_key", "version");

CREATE UNIQUE INDEX IF NOT EXISTS form_submission_idempotency_scope_idx
  ON form_submission ("user_id", "project_id", "form_key", "idempotency_key");

CREATE TABLE "rate_limit_bucket" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "expires_at" INTEGER NOT NULL
);

CREATE INDEX "rate_limit_bucket_expires_idx" ON "rate_limit_bucket" ("expires_at");

ALTER TABLE email_outbox ADD COLUMN cancelled_at INTEGER;
