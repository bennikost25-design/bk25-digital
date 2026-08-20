-- Better Auth 1.7.1 requires credential accounts to carry issuer = local:credential.
-- Append-only: do not edit 0001_init.sql or 0002_hardening.sql.

ALTER TABLE "account" ADD COLUMN "issuer" TEXT NOT NULL DEFAULT 'local:credential';

UPDATE "account"
SET "issuer" = 'local:credential'
WHERE "provider_id" = 'credential';
