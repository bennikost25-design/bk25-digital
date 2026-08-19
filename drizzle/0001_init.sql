-- BK25 Digital initial schema (Cloudflare D1 / SQLite)
PRAGMA foreign_keys = ON;

CREATE TABLE "user" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "email_verified" INTEGER NOT NULL DEFAULT 0,
  "image" TEXT,
  "created_at" INTEGER NOT NULL,
  "updated_at" INTEGER NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'customer' CHECK ("role" IN ('admin', 'customer')),
  "banned" INTEGER DEFAULT 0,
  "ban_reason" TEXT,
  "ban_expires" INTEGER
);

CREATE TABLE "session" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "expires_at" INTEGER NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "created_at" INTEGER NOT NULL,
  "updated_at" INTEGER NOT NULL,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "user_id" TEXT NOT NULL,
  "impersonated_by" TEXT,
  FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE
);

CREATE INDEX "session_user_id_idx" ON "session" ("user_id");

CREATE TABLE "account" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "account_id" TEXT NOT NULL,
  "provider_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "access_token" TEXT,
  "refresh_token" TEXT,
  "id_token" TEXT,
  "access_token_expires_at" INTEGER,
  "refresh_token_expires_at" INTEGER,
  "scope" TEXT,
  "password" TEXT,
  "created_at" INTEGER NOT NULL,
  "updated_at" INTEGER NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE
);

CREATE INDEX "account_user_id_idx" ON "account" ("user_id");

CREATE TABLE "verification" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expires_at" INTEGER NOT NULL,
  "created_at" INTEGER,
  "updated_at" INTEGER
);

CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");

CREATE TABLE "customer_profile" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL UNIQUE,
  "company_name" TEXT NOT NULL,
  "created_by_admin_id" TEXT NOT NULL,
  "created_at" INTEGER NOT NULL,
  "updated_at" INTEGER NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("created_by_admin_id") REFERENCES "user" ("id")
);

CREATE TABLE "customer_project" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "customer_profile_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "package_id" TEXT CHECK ("package_id" IN ('basis', 'komplett') OR "package_id" IS NULL),
  "status" TEXT NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'archived')),
  "created_at" INTEGER NOT NULL,
  "updated_at" INTEGER NOT NULL,
  FOREIGN KEY ("customer_profile_id") REFERENCES "customer_profile" ("id") ON DELETE CASCADE
);

CREATE INDEX "customer_project_profile_idx" ON "customer_project" ("customer_profile_id");

CREATE TABLE "project_form_access" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "project_id" TEXT NOT NULL,
  "form_key" TEXT NOT NULL,
  "granted_by_admin_id" TEXT NOT NULL,
  "granted_at" INTEGER NOT NULL,
  FOREIGN KEY ("project_id") REFERENCES "customer_project" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("granted_by_admin_id") REFERENCES "user" ("id"),
  UNIQUE ("project_id", "form_key")
);

CREATE INDEX "project_form_access_form_idx" ON "project_form_access" ("form_key");

CREATE TABLE "invitation" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL UNIQUE,
  "expires_at" INTEGER NOT NULL,
  "used_at" INTEGER,
  "revoked_at" INTEGER,
  "created_by_admin_id" TEXT NOT NULL,
  "created_at" INTEGER NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("created_by_admin_id") REFERENCES "user" ("id")
);

CREATE INDEX "invitation_user_idx" ON "invitation" ("user_id");

CREATE TABLE "contact_request" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "organization" TEXT NOT NULL,
  "package_interest" TEXT,
  "message" TEXT NOT NULL,
  "consent_at" INTEGER NOT NULL,
  "privacy_notice_version" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'new' CHECK ("status" IN ('new', 'in_progress', 'done')),
  "created_at" INTEGER NOT NULL,
  "updated_at" INTEGER NOT NULL
);

CREATE INDEX "contact_request_status_idx" ON "contact_request" ("status", "created_at");

CREATE TABLE "form_draft" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "form_key" TEXT NOT NULL,
  "schema_version" INTEGER NOT NULL,
  "payload_json" TEXT NOT NULL,
  "step_index" INTEGER NOT NULL DEFAULT 0,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'draft' CHECK ("status" IN ('draft', 'submitted')),
  "created_at" INTEGER NOT NULL,
  "updated_at" INTEGER NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("project_id") REFERENCES "customer_project" ("id") ON DELETE CASCADE,
  UNIQUE ("user_id", "project_id", "form_key")
);

CREATE INDEX "form_draft_project_idx" ON "form_draft" ("project_id", "form_key");

CREATE TABLE "form_submission" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "form_key" TEXT NOT NULL,
  "schema_version" INTEGER NOT NULL,
  "payload_json" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "idempotency_key" TEXT NOT NULL UNIQUE,
  "reference_number" TEXT NOT NULL UNIQUE,
  "submitted_at" INTEGER NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "user" ("id"),
  FOREIGN KEY ("project_id") REFERENCES "customer_project" ("id")
);

CREATE INDEX "form_submission_lookup_idx" ON "form_submission" ("project_id", "form_key", "version");
CREATE INDEX "form_submission_user_idx" ON "form_submission" ("user_id", "submitted_at");

CREATE TABLE "audit_event" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "type" TEXT NOT NULL,
  "actor_user_id" TEXT,
  "resource_type" TEXT NOT NULL,
  "resource_id" TEXT NOT NULL,
  "result" TEXT NOT NULL,
  "created_at" INTEGER NOT NULL,
  FOREIGN KEY ("actor_user_id") REFERENCES "user" ("id")
);

CREATE INDEX "audit_event_created_idx" ON "audit_event" ("created_at");
CREATE INDEX "audit_event_resource_idx" ON "audit_event" ("resource_type", "resource_id");

CREATE TABLE "email_outbox" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "type" TEXT NOT NULL,
  "to_email" TEXT NOT NULL,
  "to_name" TEXT,
  "template_key" TEXT NOT NULL,
  "payload_json" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'processing', 'sent', 'failed')),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "last_error" TEXT,
  "provider_message_id" TEXT,
  "related_resource_type" TEXT,
  "related_resource_id" TEXT,
  "created_at" INTEGER NOT NULL,
  "updated_at" INTEGER NOT NULL,
  "sent_at" INTEGER,
  "next_attempt_at" INTEGER
);

CREATE INDEX "email_outbox_status_idx" ON "email_outbox" ("status", "next_attempt_at");
